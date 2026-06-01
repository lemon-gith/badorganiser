# Badminton Pairings Generator

This is just a small webapp designed to draw up combinations of players into pairs for a badminton tournament (ensuring fairer pairing).

## Pairing Process

1. Upload a CSV of all of your group's players following the provided format
2. Toggle the level filters on and off to select your desired set of players for a preset
3. Click one of the three buttons to generate a preset for that game type based on your filters
4. Click the `Generate` button on one of the generated presets to generate a CSV file for that preset
   - this takes all the filtered down players eligible for the specified game type and returns a non-repeating combination of all pairs
5. Click the new `Download` button to download the CSV for your specified preset

## Static Site

This is implemented as a static webapp, where all of the logic is served in a single go to the client, allowing them to work offline and also relieves all the load on the server, with all the processing being entirely client-side.

Importantly, the data is client-side persisted, so there is no server-side state at all. All of the data is stored in the client's browser (persisted as site data tied to the domain).
