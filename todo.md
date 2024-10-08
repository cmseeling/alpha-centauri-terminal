## TODO

- [x] 1. Add Svelte tests
- [x] 2. Add Rust tests
- [x] 3. Implement copy/paste/other editor commands
- [x] 4. Implement window split and resizing
- [x] 5. Menu bar overhaul
- [x] 6. Figure out deep magic of current directory and current shell name
- [x] 7. Tab renaming
- [x] 8. Update README
- [ ] 9. playwright test execution on linux - refer to https://trac.webkit.org/wiki/RemoteInspectorGTKandWPE
- [x] 10. path to config file as argument
- [x] 11. create test json configuration
- [ ] 12. script to launch dev app, wait for compile + start, and start e2e test
- [x] 13. make sure shell instance actually dies on window close
- [x] 14. fix window location on startup
- [x] 15. Close tab on shell exit (user types 'exit'), end program if no tabs open
- [x] 16. Investigate why child_killer call throws error
- [ ] 17. add tests for better coverage and/or ignore some files
- [x] 18. Remove session from appstate, clean up Rust resources
- [x] 19. Hover text for full tab name/path?
- [x] 20. Change tab name when focusing different pane on tab
- [x] 21. Add fonts to settings file
- [x] 22. Set OSC numbers in settings file
- [ ] 23. Close instance after e2e tests

## Bugs

- [x] Opening a new tab and switching to another tab - terminal isn't there
- [x] shift key not working for text entry
- [x] Need to focus a terminal on the current tab when pane closes that had focus
- [ ] Opening more than 2 panes in the same direction does not resize existing panes evenly
- [x] orphaned processes when - create new shell session, close tab
- [x] changing tabs does not focus the active tab text area


figure out releaese action
sign linux build
test on mac somehow
update settings explanations and instructions