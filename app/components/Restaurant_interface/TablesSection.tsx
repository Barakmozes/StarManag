import React from 'react';
import { tableData } from '@/data/Table';
import TableModal from './TableModal';

const TablesSection = () => {
  return (
    <section className="mb-24 flex flex-col items-center md:justify-center">
      <div className="max-w-2xl mx-auto my-5 text-center">
        <h2 className="text-3xl leading-tight tracking-tight text-gray-600 sm:text-4xl">
          Table Management
        </h2>
      </div>

      <div className="my-8 grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {tableData.map((table) => (
          <TableModal key={table.tableNumber} table={table} />
        ))}
      </div>
    </section>
  );
};

export default TablesSection;
