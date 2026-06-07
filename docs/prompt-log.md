# Prompt Log

A personal record of the prompts used to build **Zero**, in chronological order.
Captured from Claude Code session transcripts. This is a human-curiosity artifact,
not a spec — prompts are reproduced as sent (lightly trimmed for length where noted).

---

## Session 1 — 2026-06-06 (scaffolding & first commit)

1. *(the `/init` CLAUDE.md generation prompt)*
   > Please analyze this codebase and create a CLAUDE.md file, which will be given to
   > future instances of Claude Code to operate in this repository. *(standard init template)*

2. **The founding spec:**
   > I want to build an app that will help me track how often I get distracted (brain thinks
   > to do something like check my phone, play video games, etc) while in a defined timeframe,
   > and how many times do I action on the impulse and actually "Do" the distraction.
   >
   > I want to have a physical device that consists primarily of two buttons (think keyboard
   > keys that will trigger API calls when pressed). Button 1 will be pressed when I have a
   > distracting impulse/thought, and button 2 will be pressed if I action on the distracting
   > impulse. I want to track things like, how many times each of these buttons are pressed per
   > day, what time of day they are pressed, and how often button 2 is pressed after button 1
   > (the user followed through with the impulse). I don't have a strong preference of which
   > language to use for the API, but I do want a corresponding frontend web app built using
   > React/Typescript/NextJS, using react-aria components as the base that can access the data
   > and generate visuals so I can see and analyze the data collected via the buttons.
   >
   > Make a plan, ask me any questions when you encounter ambiguity and I can clarify.

3. > Lets create a todo list of what needs to be done before I can fully run this app in local,
   > in lieu of having the physical devices set up yet, with a set of web UI buttons that
   > simulate physical device button presses. Add to the todo list things in the "What I
   > couldn't verify locally" section, and explicitly flag the accounts / urls that need to be
   > set up still for things like Neon, Postgres/Docker, etc.

4. > let's write the todo list to the repository somewhere, maybe like a TODOS.md that we can
   > pick up in a later session. I want to first commit and push up the changes we made so far.

5. > why is the commit associated with claude and this "Josh Wang" account, it should be
   > JoshW (jwaosh)?

6. > yes, fix the first commit too.

7. > Get started with Neon.

---

## Session 2 — 2026-06-06 → 2026-06-07 (Neon, Docker, simulator)

8. > I'm working on the TODOs now, starting with the neon connection. Just made an account and
   > have completed the setup of Neon on my local.

9. > commit these changes and push up.

10. > for the untracked files, do you recommend we push that up too? especially if another
    > developer joins us.

11. > follow your recommendation.

12. > whats the best way to install docker. do i use brew?

13. > but is this the best way to install docker? through homebrew?

14. > can you explain why/when an offline DB fallback is needed, and what it is?

15. > Let's add it now to just have the file. Update the readme to say that for now we will just
    > use Neon and the "safe throwaway experiments" strategy in their branching feature for
    > testing changes.

16. > yes, start on 14. *(the web button-press simulator)*

17. > yes, run pnpm dev so I can test it.

18. > looks good for now, shut down the local servers and push up the changes.

19. > explain more about #16.

20. > c

21. > lets delete the two test events.

22. > we can keep those.

---

## Session 3 — 2026-06-07 (this log)

23. > from your memory, can you fetch me all of the prompts I've sent you to create Zero?

24. > For personal curiosity, I'd love a log of all the prompts I've put into claude as I build
    > this project. Make a file for this transcript and upload it to the Zero repository.
