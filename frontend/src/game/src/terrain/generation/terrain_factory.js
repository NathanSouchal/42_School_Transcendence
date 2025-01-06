import Corrals from "./corrals/corrals";
import Sea from "./sea";
import BasicTerrain from "./basic_terrain";

class TerrainFactory {
  create(size, world) {
    switch (world.name) {
      case "sea":
        return new Sea(size, world);
      case "corrals":
        return new Corrals(size, world);
      default:
        return new BasicTerrain(size, world);
    }
  }
}

export default TerrainFactory;
