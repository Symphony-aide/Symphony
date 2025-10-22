# Considerations

[Failure handling strategy-9-13.pdf](Failure_handling_strategy-9-13.pdf)

think of the extension as sub-extensions

i mean what if we made Main UI extension:

- it handles:
    - Walkthroughs
    - views
    - containers

This mean you can think of its as main entry for all related things for UI, with this we can build better system

same goes for the other parts `

- Language servers, debug adapters → Advanced extensions manage their own protocols
- Task providers, problem matchers → Build extensions handle their own systems
- SCM providers → SCM extensions are fully self-contained
- Timeline, comments → Advanced features extensions manage independently
- Search functionality → Search extensions handle their own implementation

## `

we need to write requirement file for each component or sub-component like

terminal:

- Should support smart copy to ai model
- Should be concise [just a word of talk, is not real requirement]

we need also to write a development guide for us, for me, how to develop such a big app

a new concept has appeared which is extension pack:

and it means that to avoid Frankenstein problem with extensions, we need to enable something called extension pack, which is grouped extensions proved that is provides good UI/UX

i think this is essential, it is not hard feature but without it you will go Frankenstein with different extensions

we also need to think about Frankenstein problem

Because we are heavy depending on Community, we really need strong community building, we need to consider some strategies about it

also in extension pack, what if you can customize it based on detection, like to mark extensions as Python extension, so whenever a *python* mentioned or detecting python project it will load all python extensions. This is not something new, but the marking thing is new

remember we need each extension to be in sandbox, so cascading won't crash the app

---

Consider FQG and ToolCalls for each mode

like for the mode like other IDEs, what tool-calls it will have, and will it have models as functions, this is important, because we can’t make it go with infinite options we need to make it predetermined

also we need to consider, will toolcalls be mapped into FQ, or FQ will be mapped into toolcalls and Why?!!!!!!!!

[Draft Implementations](Draft%20Implementations%20225461aa270580acac27e44bab498dee.md)