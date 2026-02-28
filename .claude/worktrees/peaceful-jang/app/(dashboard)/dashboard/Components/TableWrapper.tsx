import SearchAndFilter from "./SearchAndFilter";

type TableProps = {
  title: string;
  children: React.ReactNode;
};

const TableWrapper = ({ title, children }: TableProps) => {
  return (
    <div className="my-6 rounded-lg bg-white p-4 shadow-2xl sm:my-12 sm:p-6 md:max-h-[80vh] md:overflow-y-auto">
      <div className="mb-4 sm:mb-6">
        <h2 className="mb-4 text-center text-xl font-semibold text-slate-500 sm:mb-6 sm:text-2xl">
          {title}
        </h2>

        <SearchAndFilter />
      </div>

      <div className="relative overflow-x-auto">{children}</div>
    </div>
  );
};

export default TableWrapper;
