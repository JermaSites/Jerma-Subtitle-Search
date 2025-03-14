import os
import re
import json
import shutil
import argparse
from argparse import ArgumentDefaultsHelpFormatter
from dateutil.parser import parse as parse_date, ParserError

def write_json(subs_path: str, output_path: str):
    date_pattern = re.compile(r'str?eamed\/recorded on (.*?)\)|Streamed (.*?)$')
    metadata_pattern = re.compile(r'\[\D.*?\]\n+')
    seperator_pattern = re.compile(r'[- _]+')
    title_pattern = re.compile(r'stream was "(.*?)"')
    year_estimate_pattern = re.compile(r'\d{4}(?:[\s-]+\d{4})?')
    title_trim_pattern = re.compile(r'Jerma985\s*Full\s*Stream:\s*|Jerma\s*Streams?\s*-\s*|Jerma985\s*\|\s*', re.IGNORECASE)

    processed_dir = os.path.join(subs_path, 'processed')
    os.makedirs(processed_dir, exist_ok=True)
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    entries = []
    if os.path.exists(output_path):
        with open(output_path, 'r', encoding='utf-8') as f:
            entries = json.load(f)

    for lrc_filename in os.listdir(subs_path):
        if not lrc_filename.endswith('.en.lrc'):
            continue

        with open(os.path.join(subs_path, lrc_filename), 'r', encoding='utf-8') as f:
            subtitles = metadata_pattern.sub('', f.read()).replace('\n', '')

        existing_entry = next((e for e in entries if e.get('subtitle_filename') == lrc_filename), None)

        if existing_entry:
            existing_entry['subtitles'] = subtitles
        else:
            info_filename = lrc_filename.replace('.en.lrc', '.info.json')
            info_path = os.path.join(subs_path, info_filename)

            if not os.path.exists(info_path):
                print(f'No info file for {lrc_filename}.')
            else:
                try:
                    with open(info_path, 'r', encoding='utf-8') as f:
                        data = json.load(f)

                    title_match = title_pattern.search(data['description'])
                    stream_title = title_match.group(1) if title_match else None
                    if stream_title == '???':
                        stream_title = None

                    date_match = date_pattern.search(data['description'])
                    stream_date = None
                    if date_match:
                        stream_date = date_match.group(1) or date_match.group(2)

                    if stream_date:
                        try:
                            stream_date = stream_date.replace('Novmeber', 'November')
                            stream_date = parse_date(stream_date, yearfirst=False, dayfirst=False, fuzzy=True).strftime('%Y-%m-%d')
                        except ParserError:
                            stream_date = None

                    if not stream_date:
                        year_match = year_estimate_pattern.search(data['description'])
                        if year_match:
                            stream_date = seperator_pattern.sub('-', year_match.group(0))
                            if int(stream_date[0:4]) < 2010:
                                stream_date = None

                    title = title_trim_pattern.sub('', data['title'])

                    entries.append({
                        'id': data['id'],
                        'title': title,
                        'duration': data['duration_string'],
                        'thumbnail': data['thumbnail'],
                        'upload_date': parse_date(data['upload_date'], yearfirst=True).strftime('%Y-%m-%d'),
                        'stream_title': stream_title,
                        'stream_date': stream_date,
                        'subtitle_filename': lrc_filename,
                        'subtitles': subtitles
                    })
                except KeyError:
                    if info_filename == 'PUBLIC_DOMAIN_MOVIE_NIGHT_PART_1.info.json':
                        entries.append({
                            'id': 'LbVnbjP5wiM',
                            'title': 'Jerma Streams - Public Domain Movie Night',
                            'thumbnail': 'https://i.ytimg.com/vi_webp/LbVnbjP5wiM/maxresdefault.webp',
                            'duration': '5:17:51',
                            'upload_date': '2023-05-20',
                            'stream_title': 'Public Domain Movie Night',
                            'stream_date': '2020-04-24',
                            'subtitle_filename': lrc_filename,
                            'subtitles': subtitles
                        })
                    else:
                        print(f'{info_filename} is missing keys.')

                shutil.move(info_path, os.path.join(processed_dir, info_filename))

    with open(output_path, 'w', encoding='utf-8', newline='\n') as f:
        json.dump(entries, f, indent=4)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(formatter_class=ArgumentDefaultsHelpFormatter, description='Writes subtitle info to a JSON file.')
    parser.add_argument('--json-path', type=str, default='../../assets/Subtitles.json', help='Path to save JSON file to.')
    parser.add_argument('--subs-path', type=str, default='../../assets/subtitles', help='Path to subtitle files.')
    args = parser.parse_args()

    print('\nWriting JSON...')
    write_json(args.subs_path, args.json_path)
