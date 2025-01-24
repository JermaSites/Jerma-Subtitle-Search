import os
import re
import json
import argparse
import subprocess
import webbrowser
from update_stats import parse_duration
from argparse import ArgumentDefaultsHelpFormatter

class Hallucination:
    def __init__(self, second: int, filename: str, line_number: int, url: str, reason: str):
        self.second = second
        self.filename = filename
        self.line_number = line_number
        self.url = url
        self.reason = reason

    def __str__(self):
        return f"{self.reason}: {self.filename} on line {self.line_number} at second {self.second}"

def detect_hallucinations(directory: str, json_path: str, ignored_log: str):
    hallucinations = []
    max_line_length = 500
    line_repeat_threshold = 10 # lowering this exponentially increases the number of detections
    ignored_hallucinations = set()
    long_repetition_pattern = re.compile(r'(.)\1{14,}')
    timestamp_pattern = re.compile(r'\[(\d+):(\d+\.\d+)\]')

    if os.path.exists(ignored_log):
        with open(ignored_log, 'r', encoding='utf-8') as log_file:
            ignored_hallucinations = set(log_file.read().splitlines())

    with open(json_path, 'r', encoding='utf-8') as f:
        video_info = json.load(f)

    for filename in os.listdir(directory):
        if filename.endswith(".lrc"):
            stored_info = next((info for info in video_info if info['subtitle_filename'] == filename), None)
            if stored_info:
                video_seconds = parse_duration(stored_info['duration'])
                video_url = f'https://youtube.com/watch?v={stored_info['id']}'
            else:
                video_seconds = 0
                video_url = "N/A"
                print(f"Info not found for: {filename}")

            repeat_count = 1
            lrc_path = os.path.join(directory, filename)

            with open(lrc_path, 'r', encoding='utf-8') as file:
                lines = file.readlines()
                previous_text = None
                for i in range(len(lines)):
                    line = lines[i].strip()

                    if not line or re.match(r'^\[.*?\]$', line):
                        continue

                    timestamp_match = timestamp_pattern.match(line)
                    minutes, seconds = map(float, timestamp_match.groups())
                    second = minutes * 60 + seconds

                    current_text = timestamp_pattern.sub('', line).strip()
                    if i > 0:
                        if current_text == previous_text:
                            repeat_count += 1
                        else:
                            repeat_count = 1

                        if repeat_count == line_repeat_threshold:
                            hallucination = Hallucination(second, filename, i + 1, video_url, f"Line repeated {repeat_count} times")
                            if str(hallucination) not in ignored_hallucinations:
                                hallucinations.append(hallucination)
                    previous_text = current_text

                    if len(current_text) > max_line_length:
                        hallucination = Hallucination(second, filename, i + 1, video_url, f"Line exceeds {max_line_length} chars")
                        if str(hallucination) not in ignored_hallucinations:
                            hallucinations.append(hallucination)

                    if long_repetition_pattern.search(current_text):
                        hallucination = Hallucination(second, filename, i + 1, video_url, "Long repetition of the same character")
                        if str(hallucination) not in ignored_hallucinations:
                            hallucinations.append(hallucination)

                    if re.search(r'[^\x00-\x7F]', line):
                        hallucination = Hallucination(second, filename, i+1, video_url, "Non-ASCII character")
                        if str(hallucination) not in ignored_hallucinations:
                            hallucinations.append(hallucination)

                    if second > video_seconds:
                        hallucination = Hallucination(second, filename, i+1, video_url, "Timestamp longer than video duration")
                        if str(hallucination) not in ignored_hallucinations:
                            hallucinations.append(hallucination)

                    if any(phrase in line.lower() for phrase in ["italics"]):
                        hallucination = Hallucination(second, filename, i+1, video_url, "Phrase prone to hallucinations")
                        if str(hallucination) not in ignored_hallucinations:
                            hallucinations.append(hallucination)

                    # probably only worth implementing after all other detections are resolved
                    # if a set amount of lines appear within a set amount of seconds:
                    #     hallucination = Hallucination(second, filename, i+1, video_url, "Rapid lines")
                    #     if str(hallucination) not in ignored_hallucinations:
                    #         hallucinations.append(hallucination)

    return hallucinations

def find_corresponding_audio_file(subtitle_filename: str, path: str):
    if not os.path.exists(path):
        print(f"Processed directory does not exist: {path}")
        return None

    base_filename = os.path.splitext(subtitle_filename)[0]
    base_filename = os.path.splitext(base_filename)[0]

    audio_extensions = [".mp3", ".mp4", ".m4a", ".opus", ".webm"]

    files_in_dir = os.listdir(path)

    for ext in audio_extensions:
        audio_file = base_filename + ext
        if audio_file in files_in_dir:
            audio_file_path = os.path.join(path, audio_file)
            return audio_file_path
    return None

if __name__ == "__main__":
    parser = argparse.ArgumentParser(formatter_class=ArgumentDefaultsHelpFormatter, description='Detects Whisper hallucinations in a directory of .lrc files.')
    parser.add_argument('--directory', type=str, default='../assets/subtitles', help='Directory containing .lrc files.')
    parser.add_argument('--json-path', type=str, default='../assets/Subtitles.json', help='Path to JSON file containing subtitles information.')
    parser.add_argument('--ignored-log', type=str, default='ignored_hallucinations.txt', help='File to log ignored hallucinations in.')
    parser.add_argument('--media-player-path', type=str, default='C:/Program Files/VideoLAN/VLC/vlc.exe', help='Path to media player executable. Needs to support passing file:/// URLs and --start-time argument.')
    args = parser.parse_args()

    print('Processing files...')
    hallucinations = detect_hallucinations(args.directory, args.json_path, args.ignored_log)
    print(f"Detected {len(hallucinations)} hallucinations")

    for hallucination in hallucinations:
        print(
            f"\n{'='*40}\n"
            f"Reason      : {hallucination.reason}\n"
            f"File        : {hallucination.filename}\n"
            f"Line Number : {hallucination.line_number}\n"
            f"Timestamp   : {hallucination.second} seconds\n"
            f"{'='*40}\n"
        )

        with open(os.path.join(args.directory, hallucination.filename), 'r', encoding='utf-8') as file:
            lines = file.readlines()

        subprocess.run(["code", "-g", f"{os.path.join(args.directory, hallucination.filename)}:{hallucination.line_number}"], shell=True)

        open_second = max(0, hallucination.second - 6)
        audio_file = find_corresponding_audio_file(hallucination.filename, os.path.join(args.directory, 'processed'))
        if audio_file:
            print(f"Opening audio file: {audio_file}")
            media_player = subprocess.Popen([args.media_player_path, f'file:///{audio_file}', f'--start-time={hallucination.second}'])
        else:
            webbrowser.open(f'{hallucination.url}&t={hallucination.second}s')

        decision = input("Ignore this hallucination? (y/n)").strip().lower()
        if decision == 'y':
            with open(args.ignored_log, 'a', encoding='utf-8') as log_file:
                log_file.write(str(hallucination) + '\n')

        if audio_file:
            media_player.kill()
