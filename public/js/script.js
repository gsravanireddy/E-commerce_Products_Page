/**global variables */
let products;
let filteredData = [];
let previousDataList = [];
let typeList = {};
let filteredDataValues = [];

/** init is initial view to be rendered to DOM */
function init() {
    document.getElementById('sort').addEventListener('change', sortProducts);
    fetchData();
    filterProducts();
}

/** returns json objects if fetched,
 * else displays error */
function fetchData() {
    fetch('json/products.json')
        .then(response => response.json())
        .then(data => appendData(data))
        .catch(err => console.log('error: ' + err));
}

/** assigning json data to global object
 * display initial products  */
function appendData(data) {
    products = data.products;
    displayProducts(products);
}

/** Returns Discounts price if discount is available, 
 * else returns original price **/
function getPrice(price, discount) {
    if(discount) {
        return Math.floor(price - (price * (discount / 100)));
    }
    return price;
}

/** shows the star ratings for products on DOM based on rating param */
function ratingFn(rating, id) {
    let content = '';
    for (let i = 0; i < 5; i++) {
        if (i < rating) {
            content += '<i class="fa fa-star" aria-hidden="true"></i>';
        } else {
            content += '<i class="fa fa-star-o" aria-hidden="true"></i>';
        }
    }
    $(content).appendTo(`.rating${id}`);
}

/** displays products based on list param
 * list param consists of products*/
function displayProducts(list) {
    var mainContainer = document.getElementById("cards");

    for (const { id, url, brand, price, type, rating, discount } of list) {
        let discountprice = getPrice(price, discount);
        $(`<li class="box" tabindex=0>
                <figure class="card">
                    <img class="product-img" src="${url}" alt="${brand} Product ${id}">
                    <figcaption class="brand">${brand}</figcaption>
                    <p class="description">Women ${type} Jeans</p>
                    <p class="price">
                        <span class="discountPrice">&#8377;${discountprice} </span>
                        <span class="originalPrice" style="text-decoration:line-through;">&#8377;${price}</span>
                        <span class="discount">${discount}% OFF</span><br/>
                    </p>
                    <span class="rating rating${id}"></span>
                </figure>
            </li>`).appendTo(mainContainer);

        ratingFn(rating, id);
    }
}

/** displays sorted products to the DOM based on sort dropdown */
function getSortedData(data) {
    let sortCondition = document.getElementById('sort').value;
    $("#cards").html("");

    if (sortCondition == "default") {
        data.sort((a, b) => a.id - b.id);
    } else if (sortCondition == "lowToHigh") {
        data.sort((a, b) => getPrice(a.price,a.discount) - getPrice(b.price,b.discount) );
    } else if (sortCondition == "highToLow") {
        data.sort((a, b) => getPrice(b.price,b.discount) - getPrice(a.price,a.discount));
    } else if (sortCondition == "popularity") {
        data.sort((a, b) => b.rating - a.rating);
    }
    displayProducts(data);
}

/** sort products
 * if filteredData is present, filteredData is sorted
 * else if filteredData is not present, do nothing
 * else sort global products  */
function sortProducts() {
    let getData = products;
    if (filteredDataValues.length > 0) {
        getData = filteredDataValues;
    } else if (filteredDataValues.length === 0 && Object.keys(typeList).length > 0) {
        return;
    }
    getSortedData(getData)
}

/** added eventlisteners to all checkboxes of filters */
function filterProducts() {
    var checkboxes = document.querySelectorAll("input[type=checkbox]");

    checkboxes.forEach(function (checkbox) {
        checkbox.addEventListener('change', filterProductList)
    });
}

/** filters the data based on typeObject created
 * typeObject = {
 *      brand: [];
 *      type: [];
 *      color: [];
 * }
 */
function filterProductList(event) {
    let productType = event.target.name;
    if (event.target.checked) {
        if (typeof typeList[productType] !== 'string' && typeList[productType]) {
            typeList[productType].push(event.target.value);
        } else if (typeList[productType]) {
            typeList[productType] = [typeList[productType], event.target.value]
        } else {
            typeList[productType] = event.target.value;
        }
    } else {
        if (typeof typeList[productType] === 'string') {
            delete typeList[productType];
        } else {
            let index = typeList[productType].indexOf(event.target.value);
            typeList[productType].splice(index, 1)
            if (typeList[productType].length === 0) {
                delete typeList[productType];
            }
        }
    }
    typeList = sortObj(typeList)
    filteredDataValues = [];
    filterMultipleData();
    sortProducts(filteredDataValues);
    renderFilterData();
}

/** sorts the object based on keys */
function sortObj(obj) {
    return Object.keys(obj).sort().reduce(function (result, key) {
      result[key] = obj[key];
      return result;
    }, {});
}

/** returns filtered productlist based on selected checkbox value */
function filterProductType(productslist, productType, productValue) {
    return productslist.filter((product) => product[productType] === productValue);
}

/** remove duplicates if present in list of products */
function removeDuplicateElement(data) {
    return data.filter((value, index) => data.indexOf(value) === index);
}

/** filters products */
function filterMultipleData() {
    const result = [];
    const data = products;
    for (key in typeList) {
        if (typeof typeList[key] !== 'string') { //if key of tyObject is array
            let resultData = [];
            let isBrand = true;
            if (typeList[key]) {
                typeList[key].forEach(function (element) {
                    let newProducts = [];
                    if (key === 'brand') { //data is filtered based on brand
                        newProducts = filterProductType(data, key, element);
                        filteredDataValues.push(...newProducts);
                    } else { //data is filtered when other subtypes are checked (color,type)
                        let newProducts = [];
                        isBrand = false;
                        if (filteredDataValues.length > 0) { //filters from the previous filteredData
                            newProducts = filterProductType(filteredDataValues, key, element);
                            resultData.push(...newProducts);
                        } else { //filters on global object
                            newProducts = filterProductType(data, key, element);
                            resultData.push(...newProducts);
                        }
                    }
                })
            }
            if (resultData.length > 0 || (resultData.length === 0 && !isBrand)) { //adds subtype filterData to main filteredData
                filteredDataValues = resultData;
            }
        } else { //if key of tyObject is not an array
            let newProducts = [];
            if (filteredDataValues.length > 0) { 
                newProducts = filterProductType(filteredDataValues, key, typeList[key]);
                filteredDataValues = newProducts;
            } else {
                newProducts = filterProductType(data, key, typeList[key]);
                filteredDataValues.push(...newProducts);
            }
        }
    }

    filteredDataValues = removeDuplicateElement(filteredDataValues);
};

/**displays filteredData to the DOM */
function renderFilterData() {
    $("#cards").html("");
    document.querySelector('.nodata').textContent = '';
    if (filteredDataValues.length > 0) {
        displayProducts(filteredDataValues);
    } else {
        if (Object.keys(typeList).length > 0) {
            document.querySelector('.nodata').textContent = 'No Data';
        } else {
            displayProducts(products);
        }
    }
}

init();
