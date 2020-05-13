/* puppeteer */
const express = require('express');
const models = require("./models");
const puppeteer = require('puppeteer');
const { Cluster } = require('puppeteer-cluster');

let app = express();

let productionCode = [];
let start = 8198552; // 크롤링 시작하는 상품 코드
let code;

const pageOption = {
    waitUntil: 'networkidle2'
};
(async () => {
    const cluster = await Cluster.launch({
        concurrency: Cluster.CONCURRENCY_CONTEXT,
        puppeteerOptions: {
            headless: true,
            args: [
                '--proxy-server=socks5://127.0.0.1:9050', // 프록시 설정, tor 설치 & 실행 필요!
                '--no-sandbox',
                '--disable-setuid-sandbox',
            ],
            workerCreationDelay: 1000
        },
        timeout: 600000, // 타임아웃 제한 : 10분
        maxConcurrency: 32, // 생성되는 워커 수
        monitor: true
    });
    try {
        let url = 'http://prod.danawa.com/info/?pcode=';
        // let url = 'http://api.ipify.org';
        // let url = 'https://check.torproject.org/';

        // cluster.queue(url);

        for(code = start; code < (start + 5000); code++){  // start에서 + 한 만큼 페이지 탐색
            cluster.queue(url + code); // cluster 안에서 돌아가는거랑 관계없음(비동기)
        }

        await cluster.task(async ({ page, data: url }) => {

            page.setRequestInterception(true);

            page.on('request', req => {
                switch (req.resourceType()) {
                    case 'stylesheet':
                    case 'font':
                    case 'media':
                        req.abort();
                        break;
                    default:
                        req.continue();
                        break;
                }
            });

            page.setViewport({ // 해상도 설정
                width: 1536,
                height: 864
            });

            page.on('dialog', async dialog => {
                console.log('productCode : ' + url.substring(35, url.length) + ' ' + dialog.message());
                await delay(2500);
                // await dialog.accept();
                await page.close();
            });
            
            await page.setDefaultNavigationTimeout(600000);  // 타임아웃 제한 : 10분

            await delay(1800);

            await page.goto(url);

            await delay(1800);

            await page.waitFor('#blog_content > div.summary_info > div.top_summary > h3');

            /* 상품 이름 추출 */
            let title = await productTitle(page);

            await page.waitFor('#productDescriptionArea > div > div.prod_spec > table > tbody tr');

            /* 스펙 추출 */
            let specTable = await specList(page); 
            let spec = "";
            for (let i = 0; i < specTable.length; i++) {
                spec += specTable[i];
                spec += '\n';
            }

            models.spec.create({
                product_code: url.substring(35, url.length),
                product_title: title,
                detail_spec: spec
            })
            .then(data => {
                console.log('productCode : ' + url.substring(35, url.length) + ' 크롤링 성공.');
                console.log(title + '스펙 데이터 삽입됨.');
            })
            .catch(err => {
                console.dir(err);
                console.log('스펙 데이터 삽입 실패.');
            });

            page.close();
          });

    } catch (error) {
        await cluster.idle();
        await cluster.close();
        console.error(error);
        return;
    }
    await cluster.idle();
    await cluster.close();
})();

/* 상품 이름 추출 */
let productTitle = async function (page) {
    const selector = '#blog_content > div.summary_info > div.top_summary > h3';

    let crawledTitle = await page.$eval(selector, (data) => data.textContent.trim());

    return Promise.resolve(crawledTitle);
}

 /* 스펙 추출 */
let specList = async function (page) {
    let bodyList = await page.evaluate(() => {
        const rows = document.querySelectorAll('#productDescriptionArea > div > div.prod_spec > table > tbody tr');
        const table = Array.from(rows);
        return table.map(td => td.innerText);
    });

    return Promise.resolve(bodyList);
}

let delay = function ( timeout ) {
    return new Promise(( resolve ) => {
       setTimeout( resolve, timeout );
    });
 }

 module.exports = app;
