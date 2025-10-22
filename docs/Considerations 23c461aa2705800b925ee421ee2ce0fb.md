# Considerations

we need to consider, how models will be loaded, i think we have two ways, the model is hooked through web, or installed on local machine, we have give the user a warning when the model is installed on local machine and running locally which could effect the performance

we wont support AI version control

we need to consider adding gifts for developers who create working extensions, this is very important because we highly depend on extensions and we encourage Rust Ecosystem

write post about why we chose Rust over other things

we also need the melodies files to be sharable, so user can users can reuse them

- we can make community page, where the melody is uploaded with the melody.json, summary.md, and preview.png [screenshot of the preview] file, Optional README.md
- so this mean we need to make a share button, on click it, it exports `.zip` file, and this zip file can be used in the community directly
- If [README.md](http://README.md) or preview.png file not exists, it will ask the user to continue without any of them
- if user chose majestro-mode, [README.md](http://README.md) file will be likely auto-generated
- but the question is, when to take a screenshot, we can for now add a button capture screenshot at preview tab the user has to click it if he is willing to share the melody
- 

we need to consider how our Orchestra-kit file will be defined for developer

- it should have things with permission
- it should have object value `instrument`
    - if not null, it will define related configuration for the instrument [model]
    - e.g. model is local or not
    - return:
        - hidden (bool) → it will hide it from user
        - value
    - …

projects:

- AIDE
- Official website [it will have community melodies]
- api-docs [Extension System]
-