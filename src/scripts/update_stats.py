import re
import json
import argparse
from datetime import datetime
from argparse import ArgumentDefaultsHelpFormatter

def parse_duration(duration_str: str) -> int:
    """Parse a duration string 'HH:MM:SS' or 'MM:SS' into total seconds."""
    parts = duration_str.split(':')
    parts = [int(part) for part in parts]
    if len(parts) == 3:
        hours, minutes, seconds = parts
    elif len(parts) == 2:
        hours = 0
        minutes, seconds = parts
    else:
        return 0
    return hours * 3600 + minutes * 60 + seconds

def update_readme_stats(readme_path: str, json_path: str):
    with open(json_path, 'r', encoding='utf-8') as f:
        subtitles_data = json.load(f)
    
    video_count = len(subtitles_data)
    
    word_count = 0

    for entry in subtitles_data:
        subtitles = entry['subtitles']
        cleaned_subtitles = re.sub(r'\[\d{2}:\d{2}\.\d{2}\]', ' ', subtitles)
        words = cleaned_subtitles.split()
        word_count += len(words)
    
    total_duration_seconds = sum(parse_duration(entry['duration']) for entry in subtitles_data)
    total_hours = total_duration_seconds // 3600
    total_minutes = (total_duration_seconds % 3600) // 60
    total_seconds = total_duration_seconds % 60
    total_duration = f"{total_hours}:{total_minutes:02}:{total_seconds:02}"
    
    upload_dates = [
        datetime.strptime(entry['upload_date'], '%Y-%m-%d') 
        for entry in subtitles_data 
        if 'upload_date' in entry
    ]
    earliest_video = min(upload_dates).strftime('%Y-%m-%d') if upload_dates else 'N/A'
    latest_video = max(upload_dates).strftime('%Y-%m-%d') if upload_dates else 'N/A'
    
    stats_content = (
        f"Video Count    : {video_count}\n"
        f"Word Count     : {word_count:,}\n"
        f"Duration       : {total_duration}\n"
        f"Earliest Video : {earliest_video}\n"
        f"Latest Video   : {latest_video}\n"
    )
    
    with open(readme_path, 'r', encoding='utf-8') as f:
        readme_content = f.read()
    
    readme_updated = re.sub(
        r"(<!-- Statistics -->\s*```[^`\n]*\n).*?(```)",
        rf"\g<1>{stats_content}\g<2>",
        readme_content,
        flags=re.DOTALL
    )
    
    if "<!-- Statistics -->" not in readme_updated:
        stats_section = (
            "\n<!-- Statistics -->\n\n"
            "```\n"
            f"{stats_content}"
            "```\n"
        )
        readme_updated += stats_section
    
    with open(readme_path, 'w', encoding='utf-8') as f:
        f.write(readme_updated)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(formatter_class=ArgumentDefaultsHelpFormatter, description='')
    parser.add_argument('--readme-path', type=str, default='../../README.md', help='Path to README.')
    parser.add_argument('--json-path', type=str, default='../assets/Subtitles.json', help='Path to Subtitles.json')
    args = parser.parse_args()
    
    print('Updating README...')
    update_readme_stats(args.readme_path, args.json_path)
