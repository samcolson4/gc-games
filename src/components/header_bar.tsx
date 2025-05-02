import { useState } from "react";

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
            className={activePage === "rummy" ? "nav-link active" : "nav-link"}
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
            className={activePage === "golf" ? "nav-link active" : "nav-link"}
          >
            Golf
          </a>
        </nav>
      </div>
    </>
  );
}

export default HeaderBar;
