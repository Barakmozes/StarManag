"use client";

import TableWrapper from "../Components/TableWrapper";
import OrdersFilter from "./OrdersFilter";
import AdminFetchedOrders from "./AdminFetchedOrders";
import PanelWrapper from "../Components/PanelWrapper";

export default function AdminOrderTable() {
  return (
    <PanelWrapper title="All Orders">
      <div className="mb-4">
        <OrdersFilter />
      </div>

      <table className="w-full text-left text-slate-500">
        <thead className="text-xs overflow-x-auto whitespace-nowrap text-slate-700 uppercase bg-slate-100">
          <tr>
            <th scope="col" className="px-6 py-3">Order-Number</th>
            <th scope="col" className="px-6 py-3">Payment Token</th>
            <th scope="col" className="px-6 py-3">Order-Date</th>
            <th scope="col" className="px-6 py-3">Customer</th>
            <th scope="col" className="px-6 py-3">Delivery Address</th>
            <th scope="col" className="px-6 py-3">Paid</th>
            <th scope="col" className="px-6 py-3">Collected</th>
            <th scope="col" className="px-6 py-3">Delivered</th>
            <th scope="col" className="px-6 py-3">View</th>
          </tr>
        </thead>

        <AdminFetchedOrders pageSize={8} />
      </table>
    </PanelWrapper>
  );
}
