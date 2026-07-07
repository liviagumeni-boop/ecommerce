import React, { useEffect, useState, useRef } from "react";
import api from "../../../api/axios";

import Sidebar from "../../../layout/sidebar";
import AdminHeader from "../../../layout/headeradmin";
import SalesChart from "../../../componets/ui/SalesChart";
import Table from "../../../componets/ui/Table";
import Loading from "../../../componets/ui/loading";

// ================= TYPES =================
type OrdersStatus = {
  status: string;
  value: number;
};

type WeeklySales = {
  name: string;
  sales: number;
};

type BestSelling = {
  name: string;
  value: number;
};

type User = {
  name: string;
  loyalty: number | string;
};

type DashboardData = {
  revenue: number;
  ordersTotal: number;
  ordersStatus: OrdersStatus[];
  weeklySales: WeeklySales[];
  bestSelling: BestSelling[];
  users: User[];
  outOfStock: number;
};

let dashboardCache: DashboardData | null = null;

export default function AdminHome() {
  const hasLoadedOnce = useRef(false);

  // ================= STATE =================
  const [dashboard, setDashboard] = useState<DashboardData | null>(
    dashboardCache
  );
  const [loading, setLoading] = useState(!dashboardCache);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (dashboardCache) return;

    const fetchDashboard = async () => {
      try {
        const res = await api.get<DashboardData>("/admin/dashboard");

        dashboardCache = res.data; // 👈 store globally
        setDashboard(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading || !dashboard) {
    return <Loading />;
  }

  // ================= FINANCE =================
  const finance = {
    today: { total: 1200, cash: 700, card: 500 },
    yesterday: { total: 900, cash: 400, card: 500 },
    thisMonth: { total: 14000, cash: 8000, card: 6000 },
    lastMonth: { total: 12500, cash: 7000, card: 5500 },
    revenue: dashboard.revenue || 0,
  };

  // ================= SAFE DATA =================
  const ordersTotal = dashboard.ordersTotal || 0;
  const ordersStatus = dashboard.ordersStatus || [];
  const weeklySales = dashboard.weeklySales || [];
  const bestSelling = dashboard.bestSelling || [];
  const users = dashboard.users || [];
  const outOfStock = dashboard.outOfStock || 0;

  return (
    <div className="d-flex min-vh-100 bg-light">

      <Sidebar />

      <div className="flex-grow-1 d-flex flex-column">

        <AdminHeader />

        <div className="p-4">

          {/* ================= ROW 1 FINANCE ================= */}
          <div className="row g-3 mb-4">

            <div className="col">
              <div className="card p-3 h-100">
                <h6>Today</h6>
                <h5>€{finance.today.total}</h5>
                <small>Cash €{finance.today.cash} | Card €{finance.today.card}</small>
              </div>
            </div>

            <div className="col">
              <div className="card p-3 h-100">
                <h6>Yesterday</h6>
                <h5>€{finance.yesterday.total}</h5>
                <small>Cash €{finance.yesterday.cash} | Card €{finance.yesterday.card}</small>
              </div>
            </div>

            <div className="col">
              <div className="card p-3 h-100">
                <h6>This Month</h6>
                <h5>€{finance.thisMonth.total}</h5>
                <small>Cash €{finance.thisMonth.cash} | Card €{finance.thisMonth.card}</small>
              </div>
            </div>

            <div className="col">
              <div className="card p-3 h-100">
                <h6>Last Month</h6>
                <h5>€{finance.lastMonth.total}</h5>
                <small>Cash €{finance.lastMonth.cash} | Card €{finance.lastMonth.card}</small>
              </div>
            </div>

            <div className="col">
              <div className="card p-3 h-100 bg-success text-white">
                <h6>Revenue</h6>
                <h5>€{finance.revenue}</h5>
                <small>Total Income</small>
              </div>
            </div>

          </div>

          {/* ================= ROW 2 ORDERS ================= */}
          <div className="row g-3 mb-4 align-items-stretch">

            <div className="col-md">
              <div className="card p-3 h-100 text-center">
                <h6>Total Orders</h6>
                <h3>{ordersTotal}</h3>
              </div>
            </div>

            {ordersStatus.map((o, i) => (
              <div className="col-md" key={i}>
                <div className="card p-3 h-100 text-center">
                  <h6>{o.status}</h6>
                  <h3>{o.value}</h3>
                </div>
              </div>
            ))}

            <div className="col-md">
              <div className="card p-3 h-100 bg-danger text-white text-center">
                <h6>Out of Stock</h6>
                <h3>{outOfStock}</h3>
              </div>
            </div>

          </div>

          {/* ================= ROW 3 CHARTS ================= */}
          <div className="row g-3 mb-4">

            <div className="col">
              <div className="card p-3 h-100">
                <h6>Weekly Sales</h6>
                <SalesChart data={weeklySales} type="products" />
              </div>
            </div>

            <div className="col">
              <div className="card p-3 h-100">
                <h6>Best Selling Products</h6>
                <SalesChart data={bestSelling} type="users" chartType="pie" />
              </div>
            </div>

          </div>

          {/* ================= TABLE ================= */}
          <div className="card p-3 mb-4">
            <h5>Loyal Customers</h5>
            <Table columns={["Name", "Orders","Loyal"]} data={users} />
          </div>

        </div>
      </div>
    </div>
  );
}