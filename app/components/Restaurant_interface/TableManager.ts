import { TableData, Position, Zone } from "@/types";
import { useRestaurantStore } from "@/lib/restaurantStore";

export const TableManager = {
  /**
   * Add a new table to the store with validation.
   * @param newTable - The table data to add.
   */
  addTable: (newTable: TableData) => {
    const { addTable, tableData } = useRestaurantStore.getState();
    const isDuplicate = tableData.some(
      (table) => table.tableNumber === newTable.tableNumber
    );
    if (isDuplicate) {
      console.error(`Table with number ${newTable.tableNumber} already exists.`);
      return;
    }
    addTable(newTable);
    console.log(`Table #${newTable.tableNumber} added successfully.`);
  },

  /**
   * Delete a table from the store.
   * @param tableNumber - The table number to delete.
   */
  deleteTable: (tableNumber: number) => {
    const { deleteTable, tableData } = useRestaurantStore.getState();
    const exists = tableData.some((table) => table.tableNumber === tableNumber);
    if (!exists) {
      console.error(`Table with number ${tableNumber} does not exist.`);
      return;
    }
    deleteTable(tableNumber);
    console.log(`Table #${tableNumber} deleted successfully.`);
  },

  /**
   * Move a table to a new position and area.
   * @param tableNumber - The table number to move.
   * @param newArea - The new area/zone of the table.
   * @param newPosition - The new position of the table.
   */
  moveTable: (tableNumber: number, newArea: string, newPosition: Position) => {
    const { moveTable, tableData, zones } = useRestaurantStore.getState();

    // Validate zone
    const isValidZone = zones.some((zone) => zone.name === newArea);
    if (!isValidZone) {
      console.error(`Invalid zone: ${newArea}`);
      return;
    }

    // Validate table existence
    const tableExists = tableData.some((table) => table.tableNumber === tableNumber);
    if (!tableExists) {
      console.error(`Table with number ${tableNumber} does not exist.`);
      return;
    }

    moveTable(tableNumber, newArea, newPosition);
    console.log(
      `Table #${tableNumber} moved to ${newArea} at position (${newPosition.x}, ${newPosition.y}).`
    );
  },

  /**
   * Save the current state of tables to persistent storage.
   */
  persistTables: () => {
    try {
      const { tableData, zones } = useRestaurantStore.getState();
      localStorage.setItem(
        "restaurantTables",
        JSON.stringify({ tableData, zones })
      );
      console.log("Table data saved successfully.");
    } catch (error) {
      console.error("Failed to save table data:", error);
    }
  },

  /**
   * Load tables from persistent storage.
   */
  loadTables: () => {
    try {
      const data = localStorage.getItem("restaurantTables");
      if (data) {
        const { tableData, zones } = JSON.parse(data);
        const { addTable, addZone } = useRestaurantStore.getState();

        // Populate tables
        tableData.forEach((table: TableData) => addTable(table));

        // Populate zones
        zones.forEach((zone: Zone) => addZone(zone.name, zone.floorPlanImage));

        console.log("Table data loaded successfully.");
      } else {
        console.warn("No table data found in storage.");
      }
    } catch (error) {
      console.error("Failed to load table data:", error);
    }
  },
};
