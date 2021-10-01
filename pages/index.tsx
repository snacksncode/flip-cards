import { NextPage } from "next";
import Link from "next/link";
import React, { useEffect, useState } from "react";

const API_PATH = "/api/data";

const Home: NextPage = () => {
  const [data, setData] = useState<null | any[]>(null);
  useEffect(() => {
    fetch(API_PATH)
      .then((res) => {
        if (!res.ok) throw new Error("Data fetching failed");
        return res.json();
      })
      .then((d) => {
        setData(d.data);
      });
  }, []);
  if (!data) return <p>Loading...</p>;
  return (
    <p>
      {data.map((d: any) => {
        return (
          <Link key={d.id} href={`card/${d.id}`}>
            <a style={{ display: "block" }}>Go to: {d.id}</a>
          </Link>
        );
      })}
    </p>
  );
};

export default Home;
