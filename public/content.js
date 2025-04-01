/* eslint-disable no-restricted-globals */
/* eslint-disable no-undef */
/* eslint-disable no-unused-expressions */

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

function getParameterByName(queryString, name) {
  // Escape special RegExp characters
  name = name.replace(/[[^$.|?*+(){}\\]/g, "\\$&");
  // Create Regular expression
  var regex = new RegExp("(?:[?&]|^)" + name + "=([^&#]*)");
  // Attempt to get a match
  var results = regex.exec(queryString);
  return decodeURIComponent(results[1].replace(/\+/g, " ")) || "";
}

scrollToCard = (index) => {
  console.log("scrollToCard:", index);
  return new Promise((t, l) => {
    try {
      const item = document.querySelectorAll(".info-section")[index];

      item.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });

      t(true);
    } catch (e) {
      console.log(e);
      t(false);
    }
  });
};

timeout = (e) => {
  return new Promise((t, l) => {
    try {
      setTimeout(function () {
        t();
      }, e);
    } catch (e) {
      console.log(e);
    }
  });
};

scrapCurrentPage = (index) => {
  let data = {};
  return new Promise((resolve, reject) => {
    try {
      const card = document.querySelectorAll(".v-card")[index];

      try {
        const name = card.querySelectorAll(".business-name").item(0).innerText;
        // const sNo = card.querySelectorAll(".n").item(0).innerText;

        data.name = name;
        // data.sNo = sNo;
      } catch (e) {
        console.log("Error: Name", e);
      }
      try {
        const Phone = card.querySelector(".phones").innerText;
        console.log("Phone Number Check",Phone)
        data.phone = Phone;
      } catch (e) {
        console.log("Error: phone", e);
      }

      try {
        var link = card
          .querySelector(".track-visit-website")
          .getAttribute("href");
        if (!link.startsWith("http")) {
          link = "https://www.yellowpages.com" + link;
        }

        data.website = link;
      } catch (e) {
        console.log("Error: Link", e);
      }

      try {
        var adrElements = card.querySelectorAll(".adr");
        var concatenatedValues = "";
        adrElements.forEach(function (adrElement) {
          Array.from(adrElement.childNodes)
            .filter((node) => node.nodeType === 1)
            .forEach(function (node) {
              concatenatedValues += node.textContent.trim() + " ";
            });
        });
        concatenatedValues = concatenatedValues.trim();
        data.address = concatenatedValues;
        console.log("concatenatedValues+++++", concatenatedValues);
      } catch (e) {
        console.log("Error: Address", e);
      }

      try {
        var review = card.querySelector(".ta-count").innerText.trim();
        // review = review.replace(" Ratings","")
        data.review = review.match(/\d+/g)[0];
      } catch (e) {
        console.log("Error: review", e);
      }

      try {
        // var rating = card.querySelectorAll(".extra-rating").item(0).innerText;
        var divElement = card.querySelector(".ta-rating");
        var className = divElement.className;
        var ratting = className.match(/ta-(\d+)-(\d+)/);
        if (ratting) {
          var number = ratting[1];
          var number1 = ratting[2];
          var Tn = number + number1;
          console.log("-=-=-=-======-", Tn / 10);
          data.rating = Tn / 10;
        } else {
          console.log("No number found in the string.");
        }
      } catch (e) {
        console.log("Error: Rating", e);
      }

      try {
        const hours_of_operation = card
          .querySelectorAll(".resultbox_activity")
          .item(0)
          .innerText.trim();
      } catch (e) {
        console.log("Error: Hour Of Operation", e);
      }

      try {
        var categoriesDiv = card.querySelector(".categories");
        var categoryLinks = categoriesDiv.querySelectorAll("a");
        var business = "";
        categoryLinks.forEach(function (link) {
          business += link.textContent.trim() + ", ";
        });
        business = business.slice(0, -2);
        console.log("business++++", business);
        data.business = business;
      } catch {}
      try {
        var phone = card.querySelector(".phones");
        data.phone = "";
      }catch(e){
        console.log("Error Phone: ", e);
      }
      data.phone = "";
      //data.review = reviews;

      resolve(data);
    } catch (e) {
      console.log(e);
      resolve(null);
    }
  });
};

nextPage = () => {
  return new Promise((e, t) => {
    try {
      if ("Next" == document.getElementsByClassName("next").item(0).innerText) {
        document
          .getElementsByClassName("next")
          .item(1)
          .firstElementChild.click();
        let t = document.getElementsByClassName("disabled").item(0),
          l = parseInt(t.innerText);
        (t.innerText = ++l), e();
      }
    } catch (e) {
      console.log(e);
    }
  });
};

getMobile = (data) =>
  new Promise((t, n) => {
    console.log("data@@@@@@@@@@", data);
    try {
      const query =
        // (data.sNo ?? "") !== "" ? data.sNo : data.name + " " + data.address;
        data.name + " " + data.address;

      chrome.runtime.sendMessage(
        { type: "get_phone_from_address", query: query },
        (response) => {
          if (response) {
            console.log("getMobile - " + response);
            t(response ?? "");
          } else {
            t("");
          }
        }
      );
    } catch (e) {
      console.log(e);
      t("");
    }
  });

const insertItem = (keyword, data) => {
  console.log("insertItem:", JSON.stringify(data));

  chrome.storage.local.get("scrap", function (res) {
    if (res.scrap.hasOwnProperty(keyword)) {
      //if (typeof res.scrap[keyword] !== "undefined") {
      if (res.scrap[keyword].data instanceof Array) {
        //res.scrap[keyword].data = [...res.scrap[keyword].data,data];
        res.scrap[keyword].data.push(data);
      } else {
        res.scrap[keyword].data = [data];
      }
    } else {
      res.scrap[keyword] = {
        name: keyword,
        data: [data],
      };
    }
    chrome.storage.local.set({ scrap: res.scrap });
  });
};

startScraping = (startIndex, keyword, setting) => {
  console.log("startScraping start: ", startIndex);

  return new Promise(async (resolve, reject) => {
    let items = document.querySelectorAll(".info-section");

    const totalCards = items.length;

    if (totalCards > 0) {
      console.log("startScraping total card:", totalCards);

      //var keywordData = [];

      for (let i = startIndex; i < totalCards; i++) {
        //const scrollCardSuccess = await scrollToCard(i);
        //await timeout((setting.delay ?? 1) * 1000);

        //scroll
        items[i].scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        });

        //if (scrollCardSuccess) {
        goLoop = true;
        var cardPopupResult = null;
        //while (goLoop) {

        //await timeout((setting.delay ?? 1) * 1000);
        cardPopupResult = await scrapCurrentPage(i);

        console.log(
          "startScraping cardPopupResult:",
          JSON.stringify(cardPopupResult)
        );

        if (cardPopupResult) {
          cardPopupResult.phone = await getMobile(cardPopupResult);

          goLoop = false;
          // keywordData.push(cardPopupResult)
        }
        //}

        if (cardPopupResult) {
          await insertItem(keyword, cardPopupResult);
        } else {
          console.log(
            "startScraping card " + i + ": data not found",
            totalCards
          );
        }

        // } else {
        //   console.log("select card failed");
        //   //resolve(false);
        // }
      }

      //await insertItem(keyword, keywordData);

      // items[totalCards-1].scrollIntoView({
      //   behavior: "smooth",
      //   block: "center",
      //   inline: "nearest",
      // });

      const comps = document.querySelectorAll(".info-section");

      comps[comps.length - 1].scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });

      resolve(totalCards);
    } else {
      resolve(false);
    }
  });
};

(async () => {
  console.log("Scraping Started");

  const keyword = location.href.split("/").reverse()[0]; //getParameterByName(location.href, "keyword");
  console.log("Scraping keyword:", keyword);
  const { setting } = await chrome.storage.local.get("setting");
  console.log("Scraping setting:", setting);
  var isDone = false;

  var scrapingIndex = 0;

  while (!isDone) {

    const result = await startScraping(scrapingIndex,keyword, setting);
    scrapingIndex = result;

   
   


    console.log("startScraping response:",result)

    if (!result) {
      isDone = true;
    } else {

      //next page

    

      try {

        let items = document.querySelectorAll(
          ".resultbox"
        );

        console.log("startScraping current Items:",items.length)

        if (
          items.length > scrapingIndex
        ) {
          console.log("next cards found");
          //await timeout(2000);
          //await timeout((setting.delay ?? 1) * 1000);
        } else {
          console.log("next cards not found");
          isDone = true;
        }
      } catch (e) {
        console.log(e);
      }
    }
  }

  //auto download file
  chrome.runtime.sendMessage({
    type: "download",
    keyword: keyword,
  });

  console.log("Scraping done:", isDone);
})();

(async () => {
  try {
    chrome.storage.onChanged.addListener(function (e, t) {
      let l = document.getElementsByClassName("collectedData").item(0),
        a = parseInt(l.innerText);
      l.innerText = ++a;
    });
  } catch (e) {
    console.log(e);
  }
})();
