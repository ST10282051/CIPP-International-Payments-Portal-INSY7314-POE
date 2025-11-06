import React from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";

export default function Navbar({ role }) {
  return (
    <nav className="navbar">
      <h1>Falcone CIPP</h1>
      <div>
        {role === "customer" && <Link to="/customer">Customer Dashboard</Link>}
        {(role === "employee" || role === "admin") && <Link to="/employee">Employee Dashboard</Link>}
        <Link to="/">Logout</Link>
      </div>
    </nav>
  );
}
