import React from 'react';
import { tableData } from '@/data/Table';
import TableModal from './TableModal';
type TablesSectionProps = {
  selectedZone: string | null;
  zones: { name: string; tables: number[] }[];
  clearSelectedZone: () => void;
};
const TablesSection: React.FC<TablesSectionProps> = ({
  selectedZone,
  zones,
  clearSelectedZone,
}) => {

  const filteredTables = tableData.filter((table) =>
    zones.find((zone) => zone.name === selectedZone)?.tables.includes(
      table.tableNumber
    )
  );
  if (!selectedZone) return null; // If no zone is selected, don't render anything
  return (
    <section className="mb-24 flex flex-col items-center md:justify-center">
      <div className="max-w-2xl mx-auto my-5 text-center">
        <h2 className="text-3xl leading-tight tracking-tight text-gray-600 sm:text-4xl">
      {selectedZone}
        </h2>
      </div>
      <div className="my-8 grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        { filteredTables.map((table) => (
          <TableModal key={table.tableNumber} table={table} />
        ))}
      </div>
 

    </section>
  );
};

export default TablesSection;
