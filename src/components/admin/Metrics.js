import React, { useState, useEffect } from "react";
import { Chart } from "react-google-charts";
import { RollingBall } from "../index";
import pokeball from "./pokeball.png";
import { Filter, Rejected } from "./index";
import {
  getSalesDatabyMonth,
  getTopSalesDatabyMonth,
  getTotalSalesValue,
  getSalesForecast,
  getSalesDataLastSixMonths,
} from "../../api/index";

import {
  handleSales,
  handleRetrieveSales,
  checkMonth,
  getSalesMonth,
} from "./utils";

const Metrics = ({ isAdmin }) => {
  const [month, setMonth] = useState(null);
  const [year, setYear] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [totalSales, setTotalSales] = useState(null);
  const [salesArr, setSalesArr] = useState([]);
  const [topSalesArr, setTopSalesArr] = useState([]);
  const [updateFilter, setUpdateFilter] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);
  const [goalExceeded, setGoalExceeded] = useState(null);
  const [chartData, setChartData] = useState([
    ["Month", "Volume", "Forecast"],
    ["February", 175, 4000],
    ["January", 3792, 3694],
    ["December", 2695, 2896],
    ["November", 2099, 1953],
    ["October", 1526, 1517],
  ]);

  const token = JSON.parse(localStorage.getItem("user")).token;

  const handleClose = () => setShowMetrics(false);
  const handleShow = () => {
    setShowMetrics(true);
    const sales = JSON.parse(window.localStorage.getItem("sales_array"));
    setSalesArr(sales);
  };

  useEffect(() => {
    if (month !== null && year !== null) {
      getTopSalesDatabyMonth(month, year, token)
        .then((response) => {
          const topSales = response.topMonthlySales;
          setTopSalesArr(topSales);
        })
        .catch((error) => {
          throw error;
        });

      getSalesDatabyMonth(month, year, token)
        .then((response) => {
          const monthlySales = response.monthlySales;
          handleSales(monthlySales);
          setSalesArr(handleRetrieveSales);
        })

        .catch((error) => {
          throw error;
        });

      getTotalSalesValue(month, year, token)
        .then((response) => {
          setTotalSales(response.totalSales);
        })
        .catch((error) => {
          throw error;
        });

      getSalesForecast(month, year, token)
        .then((response) => {
          setForecast(response.forecast);
        })
        .catch((error) => {
          throw error;
        });

      getSalesDataLastSixMonths(month, year, token)
        .then((response) => {
          const historicVolume = response.historic;
          const data = [["Month", "Volume", "Forecast"]];
          historicVolume.map((sale) => {
            const { month, year, value, forecast } = sale;
            data.push([
              checkMonth(parseInt(month)),
              parseInt(value),
              parseInt(forecast),
            ]);
          });

          setChartData(data);
        })
        .catch((error) => {
          throw error;
        });

      setUpdateFilter(false);
    }
  }, [updateFilter]);

  useEffect(() => {
    if (totalSales && forecast) {
      if (totalSales > forecast) {
        setGoalExceeded(true);
      } else if (totalSales < forecast) {
        setGoalExceeded(false);
      } else {
        setGoalExceeded(null);
      }
    }
  });

  return (
    <div id="metrics">
      {isAdmin ? (
        <div id="metrics_display">
          <img
            className="admin-pokeballs"
            src={pokeball}
            onClick={handleShow}
          ></img>
          <div className="admin-title">
            <div
              className={
                showMetrics === true ? "show-admin metrics-show" : "hide"
              }
            >
              <div id="metrics-body">
                <button className="close-button" onClick={handleClose}>
                  X
                </button>
                <div id="metrics-pokedex-screen">
                  <div id="top-sales">
                    <div
                      className="nes-container is-rounded is-dark"
                      id="top-pokemon-list"
                    >
                      <p>Top Sales by Month</p>
                      <div className="top-sales-container">
                        {topSalesArr
                          ? topSalesArr.map((product, index) => {
                              const { DEX, poke_name } = product;

                              return (
                                <div key={index} className="poke-top-item">
                                  {index === 0 ? (
                                    <div className="nes-container is-rounded pokemon-standing">
                                      <p className="num-one-par">
                                        <span className="number-one">
                                          {" "}
                                          {index + 1}
                                        </span>
                                        : {poke_name}
                                      </p>
                                      <img
                                        src={`https://github.com/PokeAPI/sprites/blob/master/sprites/pokemon/versions/generation-v/black-white/animated/${DEX}.gif?raw=true`}
                                        alt={`${poke_name}`}
                                      ></img>
                                    </div>
                                  ) : (
                                    <div className="nes-container is-rounded pokemon-standing">
                                      <p>
                                        {index + 1}: {poke_name}
                                      </p>
                                      <img
                                        src={`https://github.com/PokeAPI/sprites/blob/master/sprites/pokemon/versions/generation-v/black-white/animated/${DEX}.gif?raw=true`}
                                        alt={`${poke_name}`}
                                      ></img>
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          : null}
                      </div>
                    </div>
                  </div>
                  <div id="trends">
                    <Chart
                      width={"100%"}
                      height={"90%"}
                      chartType="BarChart"
                      loader={
                        <div>
                          <RollingBall />
                        </div>
                      }
                      data={chartData}
                      options={{
                        backgroundColor: "transparent",
                        title: "Monthly Sales Trends",
                        chartArea: { width: "40%" },
                        hAxis: {
                          title: "Sales Revenue",
                          minValue: 10000,
                        },
                      }}
                      // For tests
                      rootProps={{ "data-testid": "1" }}
                    />
                  </div>
                  <div id="forecast">
                    <p>Forecasted Sales</p>
                    {forecast ? (
                      <p className="forecasted-sales">₽{forecast}K</p>
                    ) : (
                      <p className="forecasted-sales"></p>
                    )}
                  </div>
                  <div id="total-sales">
                    <p>Sales Totals</p>
                    {totalSales ? (
                      <p
                        className={
                          goalExceeded === true
                            ? "green total-sales-par"
                            : goalExceeded === null
                            ? "yellow total-sales-par"
                            : "red total-sales-par"
                        }
                      >
                        ₽{totalSales}K
                      </p>
                    ) : (
                      <p className="total-sales-par"></p>
                    )}
                  </div>
                  <div id="sales-list">
                    Filter Sales Data
                    <div className="admin-filter">
                      <Filter
                        setMonth={setMonth}
                        setYear={setYear}
                        month={month}
                        year={year}
                        setUpdateFilter={setUpdateFilter}
                      />
                    </div>
                    <table
                      className="nes-table is-bordered is-centered"
                      id="sales-table"
                    >
                      <tbody>
                        <tr>
                          <th>ID</th>
                          <th>Date</th>
                          <th>Product</th>
                          <th>Quantity Sold</th>
                          <th>Value</th>
                        </tr>
                        {salesArr
                          ? salesArr.map((sale, index) => {
                              console.log("SALE", sale);
                              const {
                                prod_id,
                                transaction_id,
                                transaction_date,
                                order_quantity,
                                name,
                                description,
                                price,
                              } = sale;
                              return (
                                <tr className="sales-rows" key={index}>
                                  <td id="metrics-id">{transaction_id}</td>
                                  <td id="metrics-date">{transaction_date}</td>
                                  <td id="metrics-name">{name}</td>
                                  <td id="metrics-quantity">
                                    {order_quantity}
                                  </td>
                                  <td id="metrics-value">
                                    {(price * order_quantity).toFixed(2)}
                                  </td>
                                </tr>
                              );
                            })
                          : null}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            Metrics
          </div>
        </div>
      ) : (
        <Rejected />
      )}
    </div>
  );
};

export default Metrics;
