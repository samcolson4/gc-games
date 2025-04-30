import React, { useState } from "react";

function HeaderBar({ setPage }: { setPage: (page: string) => void }) {
  const [activePage, setActivePage] = useState("rummy");

  return (
    <>
      <div>
        <h1>Goodridge Colson Games</h1>
        <nav style={{ textAlign: "center", marginTop: "10px" }}>
          <a
            href="#rummy"
            onClick={(e) => {
              e.preventDefault();
              setPage("rummy");
              setActivePage("rummy");
            }}
            style={{
              textDecoration: activePage === "rummy" ? "underline" : "none",
              textUnderlineOffset: "0.3rem",
            }}
          >
            Rummy
          </a>
          <a
            href="#golf"
            onClick={(e) => {
              e.preventDefault();
              setPage("golf");
              setActivePage("golf");
            }}
            style={{
              textDecoration: activePage === "golf" ? "underline" : "none",
              textUnderlineOffset: "0.3rem",
            }}
          >
            Golf
          </a>
        </nav>
      </div>
    </>
  );
}

export default HeaderBar;
