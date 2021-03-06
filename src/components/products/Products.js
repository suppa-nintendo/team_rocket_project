// react imports
import React, { useState, useEffect } from "react";

// react bootstrap imports
import { Row } from "react-bootstrap";

// component imports
import ProductRender from "./ProductRender";
import ProductSearch from "./ProductSearch";
import ProductSorter from "./ProductSorter";
import ProductFilter from "./ProductFilter";
import ProductsLoadingModal from "./ProductsLoadingModal";

const Products = ({ getAllProducts, getAllTypes }) => {
  // product states
  const [allProducts, setAllProducts] = useState([]);
  const [currentProducts, setCurrentProducts] = useState([]);

  // oading modal state
  const [showLoading, setShowLoading] = useState(true);

  // search/sort/filter states
  const [allTypes, setAllTypes] = useState([]);
  const [filterMessage, setFilterMessage] = useState("");
  const [searchVal, setSearchVal] = useState("");
  const [sortMethod, setSortMethod] = useState("");
  const [sortMessage, setSortMessage] = useState("Sort pokemon...");

  // front-end pagination state, incrementing by 12
  const [indexStart, setIndexStart] = useState(0);
  const [indexEnd, setIndexEnd] = useState(12);

  // front-end pagination next page
  function renderNextPage() {
    setIndexStart(indexStart + 12);
    setIndexEnd(indexEnd + 12);
    localStorage.setItem(
      "pageQuery",
      JSON.stringify({ start: indexStart + 12, end: indexEnd + 12 })
    );
  }
  // front-end pagination previous page
  function renderPrevPage() {
    setIndexStart(indexStart - 12);
    setIndexEnd(indexEnd - 12);
    localStorage.setItem(
      "pageQuery",
      JSON.stringify({ start: indexStart - 12, end: indexEnd - 12 })
    );
  }
  // resets pagination for search/sort/filters
  function resetPagination() {
    setIndexStart(0);
    setIndexEnd(12);
    localStorage.removeItem("pageQuery");
  }
  // scrolls to top of page when next/prev buttons are clicked
  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  useEffect(() => {
    // sets loading state to true
    setShowLoading(true);
    // grabs all pokemon entries from the database
    getAllProducts()
      .then((response) => {
        // default product sort by 'dex_id' key, ascending before setting states
        response.sort((a, b) => {
          a = a.dex_id;
          b = b.dex_id;
          return a - b;
        });
        setAllProducts(response);
        setCurrentProducts(response);

        return response;
      })
      .then((response) => {
        // checks localStorage for a stored sort query
        let sortQuery = JSON.parse(localStorage.getItem("sortQuery"));
        // applies stored sort query if it exists
        if (sortQuery !== null) {
          const { message, key, type } = sortQuery;
          setSortMessage(message);
          setSortMethod(key);
          sortProductsByKey(response, key, type, setAllProducts);
          const sortedProducts = sortProductsByKey(
            response,
            key,
            type,
            setCurrentProducts
          );
          return sortedProducts;
        }
        return response;
      })
      .then((response) => {
        // checks localStorage for a stored search query
        let searchQuery = localStorage.getItem("searchQuery");
        // applies stored search query if it exists
        if (searchQuery !== "" && searchQuery !== null) {
          searcher(searchQuery, response);
          setSearchVal(searchQuery);
        }

        // checks localStorage for a stored filter query
        let filterQuery = localStorage.getItem("filterQuery");
        // applies stored filter query if it exists
        if (filterQuery !== null) {
          setFilterMessage(filterQuery);
          if (filterQuery === "Featured products") {
            let copy = [];
            response.forEach((product) => {
              if (product.is_featured) {
                copy.push(product);
              }
            });
            setCurrentProducts(copy);
          } else {
            typeFilter(filterQuery, response);
          }
        }

        // checks localStorage for a stored page query
        let pageQuery = JSON.parse(localStorage.getItem("pageQuery"));
        // applies stored page query if it exists
        if (pageQuery !== null) {
          const { start, end } = pageQuery;
          setIndexStart(start);
          setIndexEnd(end);
        }
      })
      .then(() => {
        setShowLoading(false);
      })
      .catch((error) => {
        console.log(error);
      });

    // grabs all type entries from the database
    getAllTypes()
      .then((response) => {
        // sorts types alphabetically before setting state
        response.sort(alphabetize);
        setAllTypes(response);
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

  // function used to alphabetize the types object array, based on the key 'name'
  function alphabetize(a, b) {
    a = a.name.toLowerCase();
    b = b.name.toLowerCase();

    let comparison = 0;
    if (a > b) {
      comparison = 1;
    } else if (a < b) {
      comparison = -1;
    }
    return comparison;
  }

  // function to filter product by types, passed into both ProductRender & ProductTypeFilter
  function typeFilter(val, array) {
    if (searchVal !== "") {
      setSearchVal("");
    }
    let copy = array ? [...array] : [...allProducts];
    let filtered = [];
    copy.forEach((poke) => {
      let pokeType = poke.type.toString();
      if (pokeType.match(val)) {
        filtered.push(poke);
      }
    });
    setCurrentProducts(filtered);
  }

  // search function built to comb the product object for string matches in any of the given fields
  function searcher(val, array) {
    if (filterMessage !== "") {
      setFilterMessage("");
    }
    let copy = array ? [...array] : [...allProducts];
    let filtered = [];
    copy.forEach((poke) => {
      let pokeDex = poke.dex_id.toString();
      let pokeName = poke.name.toLowerCase();
      let pokeType = poke.type.toString();
      let pokeDesc = poke.description.toLowerCase();
      let pokeHeight = poke.height.toString();
      let pokeWeight = poke.weight.toString();
      let pokePrice = poke.price.toString();
      if (pokeDex.includes(val)) {
        filtered.push(poke);
      } else if (pokeName.includes(val)) {
        filtered.push(poke);
      } else if (pokeType.includes(val)) {
        filtered.push(poke);
      } else if (pokeDesc.includes(val)) {
        filtered.push(poke);
      } else if (pokeHeight.includes(val)) {
        filtered.push(poke);
      } else if (pokeWeight.includes(val)) {
        filtered.push(poke);
      } else if (pokePrice.includes(val)) {
        filtered.push(poke);
      }
    });
    setCurrentProducts(filtered);
  }

  // sorts the given array based on a given object key
  // sortMethod is a callback function to signal setting all/current products
  function sortProductsByKey(productArray, key, sortType, setProductsMethod) {
    let sorted = [...productArray];
    // sorts keys high to low (sortMethod === 1)
    if (sortType === 1) {
      sorted.sort((a, b) => {
        a = parseInt(a[key]);
        b = parseInt(b[key]);
        return b - a;
      });

      //   sorts keys low to high (sortMethod === 2)
    } else if (sortType === 2) {
      sorted.sort((a, b) => {
        a = parseInt(a[key]);
        b = parseInt(b[key]);
        return a - b;
      });
    } else if (sortType === 3) {
      sorted.sort(alphabetize);
    } else if (sortType === 4) {
      sorted.sort(alphabetize);
      sorted.reverse();
    }
    setProductsMethod(sorted);
    return sorted;
  }
  return showLoading ? (
    <ProductsLoadingModal showLoading={showLoading} />
  ) : (
    <>
      <Row className="search-sort-filter-container">
        <div className="search-filter-container">
          {/** product search component*/}
          <ProductSearch
            searcher={searcher}
            searchVal={searchVal}
            setSearchVal={setSearchVal}
            resetPagination={resetPagination}
          />
          {/** product filter component*/}
          <ProductFilter
            allProducts={allProducts}
            setCurrentProducts={setCurrentProducts}
            allTypes={allTypes}
            typeFilter={typeFilter}
            filterMessage={filterMessage}
            setFilterMessage={setFilterMessage}
            resetPagination={resetPagination}
          />
        </div>
        {/** product sort component */}
        <div className="sort-container">
          <ProductSorter
            allProducts={allProducts}
            setAllProducts={setAllProducts}
            currentProducts={currentProducts}
            setCurrentProducts={setCurrentProducts}
            sortMethod={sortMethod}
            setSortMethod={setSortMethod}
            sortMessage={sortMessage}
            setSortMessage={setSortMessage}
            resetPagination={resetPagination}
            sortProductsByKey={sortProductsByKey}
          />
        </div>
      </Row>
      <Row className="pokemon-cards-container">
        {/** render products component */}
        <ProductRender
          currentProducts={currentProducts}
          typeFilter={typeFilter}
          setFilterMessage={setFilterMessage}
          sortMethod={sortMethod}
          indexStart={indexStart}
          indexEnd={indexEnd}
          searchVal={searchVal}
          filterMessage={filterMessage}
        />
      </Row>
      <Row className="pagination-container">
        {/** previous page pagination component, conditionally rendered */}
        {indexStart === 0 ? (
          ""
        ) : (
          <button
            className="previous-page-button nes-btn"
            onClick={() => {
              scrollToTop();
              renderPrevPage();
            }}
          >
            Previous Page
          </button>
        )}
        {/** next page pagination component, conditionally rendered */}
        {indexEnd >= currentProducts.length ? (
          ""
        ) : (
          <button
            className="nes-btn"
            onClick={() => {
              scrollToTop();
              renderNextPage();
            }}
          >
            Next Page
          </button>
        )}
      </Row>
    </>
  );
};

export default Products;
