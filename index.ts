

import html from 'escape-html-template-tag';
import Parser, { type Item } from 'rss-parser'
import assert from 'assert'
const feedURLByTopic = {
    world: "https://feeds.bbci.co.uk/news/world/rss.xml",
    politics: "https://feeds.bbci.co.uk/news/politics/rss.xml?edition=int",
    business: "https://feeds.bbci.co.uk/news/business/rss.xml",
    health: "https://feeds.bbci.co.uk/news/health/rss.xml",
    education: "https://feeds.bbci.co.uk/news/education/rss.xml",
    science: "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml",
    tech: "https://feeds.bbci.co.uk/news/technology/rss.xml",
    entertainment: "https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml"

}
const feedContentByTopic: { [index: string]: Item[] } = {
}
const parser = new Parser();
let lastUpdate: Date | undefined;


async function fetch() {


    Object.keys(feedURLByTopic).forEach(async (key) => {
        console.log(`[CRONJOB]: Fetching feed ${key}...`)
        let feed = await parser.parseURL((feedURLByTopic as any)[key]);

        (feedContentByTopic as any)[key] = feed.items;

    })

    lastUpdate = new Date();
}

const i = setInterval(() => {
    fetch()


}, 1000 * 60 * 2)
fetch()
Bun.serve({
    async fetch(req) {
        const url = new URL(req.url)
        const query = url.searchParams
        const topic = query.get("topic") || "world"
        console.log(`[REQ]: ${url.pathname}${url.search} ${this.requestIP(req)?.address}`)

        assert(Object.keys(feedURLByTopic).includes(topic))


        const innerHTML = `
<html>
    <head>
        <style>
            *{
                margin: 0;
            }
            body{
                color: #828282;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
                padding: 0.5rem;
                padding-bottom: 6rem;
            }
            ol{
                background-color: #f6f6ef;
                max-width: 90rem;
                margin: 0pt auto;
            }
            li{
                
                padding: 1rem 0.5rem 0.5rem 0.5rem;
            }
            a {
                color: #000;
            }
            a.selected{
                color: blue;
            }
            li a{
                color: #000;
                text-decoration: none;
            }
            li a:hover{
                text-decoration: underline;
            }
            .green{
                background-color: #8EBF00;
                padding: 0.25rem 0.5rem;
            }
            .row, nav{
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            footer{
                text-align:center;
                font-size: 0.8rem;
            }
            .brand{
                font-weight: bold;
                color: #000;
                margin-right: 0.5rem;
            }
            .date{
                text-align: right;
            }
            @media only screen 
            and (max-width: 430px) 
            and (max-height: 932px){
                .row{
                    flex-direction: column;
                }   
                nav{
                    box-sizing: border-box;
                    position: fixed;
                    display: flex;
                    bottom: 0pt;
                    left: 0pt;
                    width: 100vw;
                    max-width: 100vw;
                    overflow: scroll;
                    padding: 1rem;
                    background-color: #8EBF00;
                }
                .date{
                    text-align:center
                }
                .date br{
                    display:none;
                }
            }
        </style>
        <title>Listed News [${topic}]</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

    </head>
    <body>
        <div class="green row">
            <p class="brand">Listed News </p>
            <nav>
                ${Object.keys(feedURLByTopic).map(t => html`<a class="${t == topic ? 'selected' : 'unselected'}" href="?topic=${t}">${t}</a>`).join("|")}
            </nav>
            <p class="date">Last update:<br /> ${lastUpdate?.toLocaleString()}</p>
        </div>
        <ol>
            ${((feedContentByTopic as any)[topic] || []).map((item: Item) => html`<li>
                    <a target="_blank" href="${item.link}">${item.title}</a><br />
                    <p>${new Date(item.isoDate || "").toLocaleString()}</p>
                </li>`).join("\n")}
        </ol>
        <footer>
                <p>News are fetched from <a href="https://www.bbc.co.uk/news/10628494/">BBC News RSS feeds</a>. This is a non-profit operation.</p>
        </footer>
    </body>
</html>
        `


        return new Response(innerHTML.toString(), {
            headers: {
                "Content-Type": "text/html; charset=utf-8"
            }
        });
    },
});


