"use client";

import OrdersFilter from "./OrdersFilter";
import AdminFetchedOrders from "./AdminFetchedOrders";
import PanelWrapper from "../Components/PanelWrapper";

export default function AdminOrderTable() {
  return (
    <PanelWrapper title="All Orders">
      <div className="mb-4">
        <OrdersFilter />
      </div>

      <AdminFetchedOrders pageSize={8} />
    </PanelWrapper>
  );
}
