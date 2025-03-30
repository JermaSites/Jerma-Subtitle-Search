> All contributions are greatly appreciated. ![](https://i.imgur.com/WTZj4Yu.png)

You'll need a GitHub account to contribute.  
Sign up here if you don't already have one: https://github.com/signup

# Ways of contributing

- [Adding videos](#adding-videos)
- [Editing code](#code-editing) *
- [Editing subtitles](#subtitle-editing) *
- [Editing video info](#video-info-editing)

> For entries marked with a asterisk:  
> You'll need to [fork this repository](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/fork-a-repo), make edits on your fork and finally [create a pull request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request-from-a-fork) to add your changes to this repository.  
> If you're only going to be making small tweaks just use the GitHub web interface, otherwise use something more powerful like [VSCode](https://code.visualstudio.com/download).  
> Pull request title / commit message wording doesn't matter.

## Adding Videos

If you'd like a video to be transcribed and added to the site [open an issue](https://github.com/JermaSites/Jerma-Subtitle-Search/issues/new?template=video-addition.yml).

### Prerequisetes

- Has to be on YouTube.
- Jerma has to speak in it.

### Ineligible Videos

- Newly uploaded streams - they'll get added as soon as possible.
- Videos already added - look through [downloaded.txt](/src/scripts/get_subtitles/downloaded.txt) to check (<kbd>Ctrl</kbd>+<kbd>F</kbd>).

## Code Editing

Themes can be added by editing [_variables.scss](/src/styles/_variables.scss) and [Settings.ts](/src/components/Settings.ts#L96).  
Fonts can be added by editing [_fonts.scss](/src/styles/_fonts.scss), [Settings.ts](/src/components/Settings.ts#L102) and [index.html](/index.html#L17).  
Secrets/easter eggs can be added by editing [Secrets.ts](/src/components/Secrets.ts) and [Secrets.scss](/src/styles/Secrets.scss).

If you find something that is or could be consistently transcribed wrongly, it could potentially be added to [refine_subtitles in get_subtitles.py](/src/scripts/get_subtitles/get_subtitles.py#200).

### Examples of valid replacements

- Words that should be capitilized uniquely
    - Acronyms (MMO, FPS, GTA etc.)
    - [Honorifics](https://en.wikipedia.org/wiki/English_honorifics) (Dr, Mr, Ms, Lord of Cinder etc.)
    - [Proper nouns](https://en.wikipedia.org/wiki/Proper_noun) (names, places, game/movie titles etc.)
    - Twitch Emotes (BabyRage, pepeD, jermaCheesed etc.)
- Words that get spelled wrong/inconsistently
    - Made up words (Jerma, Ster, Yoinky Sploinky, Phlogistinator etc.)
    - Words spelled differently across the world that are pronounced the same should use American spelling (see [this Wikipedia article](https://en.wikipedia.org/wiki/Wikipedia:List_of_spelling_variants) for examples - *spelt* and *spelled* are pronounced differently, so they aren't valid)

### Examples of invalid replacements

While these technically fall into the categories mentioned [here](#examples-of-valid-replacements), they're too general to replace programmatically and need to be dealt with manually.

- auto -> [Otto](https://www.youtube.com/watch?v=aXSdCYQOuW0)
- boulder -> [Boulder](https://en.wikipedia.org/wiki/Boulder,_Colorado)
- grace -> [Grace](https://en.wikipedia.org/wiki/Grace_(given_name))
- reading -> [Reading](https://en.wikipedia.org/wiki/Reading,_Berkshire)
- steam -> [Steam](https://store.steampowered.com)

## Subtitle Editing

If you find something that needs editing while using the site you can use the edit buttons that appear when hovering a line to edit it on GitHub.

When creating new lines timestamps don't have to be *super* accurate - just make sure it's within ~2 seconds, preferably too early than too late.

If you want to make a lot of edits, have a look at [detect_hallucinations.py](/src/scripts/detect_hallucinations.py) to aid in finding lines that need editing.

### Types of mistakes WhisperX makes

#### Overly long lines

[Examples](https://github.com/JermaSites/Jerma-Subtitle-Search/commit/d630649d50f6549a12c1ddb5fa5b3fcbac2f2526)

Sometimes run-on sentences are created that span potentially hundreds of characters.   
These are often unpunctuated & uncapitilized.  
They [look pretty ugly when rendered on the site](https://i.imgur.com/qiDOOSj.png) and should be shortened.

Scroll through any given stream transcription and you'll probably find a few of these.

Caused by: fast talking/repetition of the same word, people talking over each other

#### Repeated characters

[Examples](https://github.com/JermaSites/Jerma-Subtitle-Search/commit/a9478146b8106f4df8b06d9216784222710160a3)

These can prevent transcription of succeeding words for a few moments. 

Caused by: dragging out a word, saying the same character in quick succession

#### Repeated lines

[Examples](https://github.com/JermaSites/Jerma-Subtitle-Search/commit/a42064082fb060780b8b9a30f95c6c62acb22e87)

Caused by: repeating the same phrase multiple times

#### Incorrect timestamps

Timestamp accuracy tends to dip around previously mentioned types.  

#### Incorrect spelling

Sometimes words will be spelled or capitalized incorrectly, but won't be able to be corrected programmatically.  
In addition to ones mentioned [here](#examples-of-invalid-replacements):

- "Jerma" sometimes gets transcribed as "remember"

#### End of video hallucinations

Sometimes after Jerma says goodbye at the end of a stream or video a few words/sentences are hallucinated between the last instance of speech and when the video ends.

## Video Info Editing

If you want to edit [Subtitles.json](https://subtitlefiles.jerma.io/file/jerma-subtitles/Subtitles.json) [open an issue](https://github.com/JermaSites/Jerma-Subtitle-Search/issues/new?template=video-info-edit-request.yml).

### Adding stream dates & titles

Most old streams might not have stream titles or accurate dates available.

### Overwriting thumbnails

A lot of stream VOD thumbnails are just screenshots from random moments.  
The only prerequisites are: thumbnails should be 16:9 and SFW.

> Contributions that don't fit into any of these categories are welcome too.

<p align='center'>
    <picture>
        <img src='https://i.imgur.com/BRlWR4g.png' alt='jermaHeartman Emote' width='56' height='56' />
    </picture>
</p>
