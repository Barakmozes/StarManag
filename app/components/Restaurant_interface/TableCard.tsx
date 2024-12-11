import React from 'react';

type Props = {
  table: {
    tableNumber: number;
    diners: number;
    area: string;
    reserved?: boolean;
  };
  openModal: () => void;
};

const TableCard = ({ table, openModal }: Props) => {
  return (
    <div
      className="flex flex-col rounded-lg shadow-md hover:scale-105 hover:shadow-lg transition-all duration-200 ease-out cursor-pointer bg-white"
      onClick={openModal}
    >
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-700">
          Table #{table.tableNumber}
        </h3>
        <p className="text-sm text-gray-500">Area: {table.area}</p>
        <p className="text-sm text-gray-500">Diners: {table.diners}</p>
        <p
          className={`text-sm font-medium ${
            table.reserved ? 'text-red-500' : 'text-green-500'
          }`}
        >
          {table.reserved ? 'Reserved' : 'Available'}
        </p>
      </div>
    </div>
  );
};

export default TableCard;
