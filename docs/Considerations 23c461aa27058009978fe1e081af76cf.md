# Considerations

- We should handle the situation where a good path has been found then after explorations, the final output is bad path, so it should consider use the good path
- We should consider experience, like if user X asked to build Gym App, and the model succeeded, then another user Y asked to build same app or with similar features, if the model failed to create it, it could use the succeeded one from experience or even better to try to build upon this experience
- we need to define when optimal [global] goal is reached and when local [goal] is reached
- we need to consider those models optimizations things like EarlyStopping, …etc.
- we need to consider to make the model define the steps as initial roadmap and then can be changed dynamically, but at least has a visualization of steps
- we need to consider non-functional things in our app, like if the model wants to open preview tab, this is not pure function according to `Function Quest`
- we need to consider the model narrative talking
- we could consider at preload state, that a model tries to create different initial roadmaps and if all of them are low score this is the failure so it should done the things above
- we need to consider if the RL model will be:
    - **model-free (Traditional)**
    - **Hybrid Systems (RL + Logic / LLM)**
    
    and based on that, we will do FQ tests, if we are going to use Hybrid, then we first need to test Vendor models independently to know which one is better at solving the levels and challenges then we need to do it again as full system, so Hybrid approach looks more reliable but more cost, more time, more complexity, more testing code or code in general