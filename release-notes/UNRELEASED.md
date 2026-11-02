# Unreleased

Target version: 0.9.0

## What Changed

### Added

- `MorelordCore.deleriumSearch` is the shared Delerium Search API, and it is the same object as `game.modules.get("morelord-core").api.deleriumSearch`. The caller keeps the session. `available()` is true when Drakkenheim Core, Drakkenheim Monsters, or Drakkenheim SCGD is active. Zones are Outer City (DC 15) and Inner City (DC 20). Skills are Arcana, Investigation, and Survival. Three successes award a Delerium Chip (`3d6`), four add a Delerium Fragment (`1d6`), and five or more also add a Delerium Shard (`1`). Two or more failures mark a random encounter and still keep any rewards. `openResults` opens **Delerium Search Results**, with **Roll & Award All Delerium** and **Open Morelord Encounters**.
