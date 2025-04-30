function HeaderBar({ setPage }: { setPage: (page: string) => void }) {
  return (
    <>
      <div>
        <h1>Goodridge Colson Games</h1>
        <nav style={{ textAlign: "center", marginTop: "10px" }}>
          <a
            href="#"
            onClick={() => setPage("rummy")}
            style={{ margin: "0 15px" }}
          >
            Rummy
          </a>
          <a
            href="#"
            onClick={() => setPage("golf")}
            style={{ margin: "0 15px" }}
          >
            Golf
          </a>
        </nav>
      </div>
    </>
  );
}

export default HeaderBar;
