import { Link, useLocation } from "react-router-dom";

function HeaderBar() {
  const location = useLocation();
  const activePage = location.pathname === "/" ? "rummy" : location.pathname.slice(1);

  return (
    <>
      <div>
        <h1>Goodridge Colson Games</h1>
        <nav style={{ textAlign: "center", marginTop: "10px" }}>
          <Link
            to="/"
            className={activePage === "rummy" ? "nav-link active" : "nav-link"}
          >
            Rummy
          </Link>
          <Link
            to="/golf"
            className={activePage === "golf" ? "nav-link active" : "nav-link"}
          >
            Golf
          </Link>
          <Link
            to="/suburb"
            className={activePage === "suburb" ? "nav-link active" : "nav-link"}
          >
            Suburb
          </Link>
          <Link
            to="/nz"
            className={activePage === "nz" ? "nav-link active" : "nav-link"}
          >
            NZ
          </Link>
        </nav>
      </div>
    </>
  );
}

export default HeaderBar;
