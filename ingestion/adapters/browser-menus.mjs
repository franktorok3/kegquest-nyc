import { load } from "cheerio";
const clean = (s) => s.replace(/\s+/g, " ").trim();
export function parseBrowserMenu(adapter, html) {
  const $ = load(html),
    out = [];
  const add = (name, style, abv, price) => {
    name = clean(name);
    style = clean(style);
    if (!name || !style || /\b(cider|seltzer|wine|cocktail)\b/i.test(style))
      return;
    if (!out.some((b) => b.name === name))
      out.push({
        name,
        style,
        ...(abv !== undefined ? { abv } : {}),
        ...(price ? { price: clean(price) } : {}),
      });
  };
  if (adapter === "craftpeak") {
    $('[data-tab="drafts"] .list-item,[data-tab="draft-list"] .list-item').each(
      (_, el) => {
        const e = $(el),
          a = e
            .find(".item-abv")
            .text()
            .match(/(\d+(?:\.\d+)?)%/);
        add(
          e.find(".item-title").text(),
          e.find(".item-descriptor").text(),
          a ? +a[1] : undefined,
        );
      },
    );
  }
  if (adapter === "grimm") {
    $(".list-item").each((_, el) => {
      const e = $(el);
      if (
        !e.find('.format-icon[src*="icon-draft"]').length ||
        !e.find('a[href*="/beer/"]').length
      )
        return;
      const a = e
        .find(".item-abv")
        .text()
        .match(/(\d+(?:\.\d+)?)%/);
      add(
        e.find(".item-title").text(),
        e.find(".item-descriptor").text(),
        a ? +a[1] : undefined,
      );
    });
  }
  if (adapter === "beermenus") {
    $("ul.list")
      .filter(
        (_, el) =>
          clean($(el).find("lh").first().text()).toLowerCase() === "on tap",
      )
      .find("li.list-item")
      .each((_, el) => {
        const e = $(el);
        if (
          !e
            .find(".serving-type")
            .toArray()
            .some((s) => /^(draft|cask)$/i.test(clean($(s).text())))
        )
          return;
        const a = e
          .find(".beer-meta")
          .text()
          .match(/(\d+(?:\.\d+)?)\s*%/);
        add(
          e.find(".beer-name").text(),
          e.find(".beer-style").text(),
          a ? +a[1] : undefined,
          e.find(".serving-price").first().text(),
        );
      });
  }
  if (adapter === "fifth-hammer") {
    $(".menu-item").each((_, el) => {
      const e = $(el),
        price = clean(e.find(".menu-item-price-top").text());
      if (!/oz.*(?:Pour|Glass)/i.test(price) || /can pour/i.test(price)) return;
      const m = clean(e.find(".menu-item-description").text()).match(
        /^(\d+(?:\.\d+)?)%\s+(.+)$/,
      );
      if (m) add(e.find(".menu-item-title").text(), m[2], +m[1], price);
    });
  }
  if (adapter === "kills-boro") {
    $("h4").each((_, el) => {
      const e = $(el).parent().parent().parent(),
        name = $(el).text(),
        desc = clean(e.find("p").first().text());
      if (
        /^(N\/A|MILK TUBES|STICHFASS)/.test(name) ||
        !desc ||
        desc === "No description available"
      )
        return;
      const a = desc.match(/(\d+(?:\.\d+)?)\s*%\s*ABV/i);
      const style = desc.replace(/\s*-?\s*\d+(?:\.\d+)?\s*%\s*ABV/i, "").trim();
      add(name, style, a ? +a[1] : undefined);
    });
  }
  if (adapter === "gunhill") {
    $("section")
      .filter((_, e) => clean($(e).find("h2").first().text()) === "Draft Beer")
      .find("h3")
      .each((_, el) => {
        const e = $(el).parent().parent(),
          m = clean(e.find("p").first().text()).match(
            /^(.+),\s*(\d+(?:\.\d+)?)%$/,
          );
        if (m) add($(el).text(), m[1], +m[2]);
      });
  }
  if (adapter === "beermenus-page") {
    $("#on_tap li").each((_, el) => {
      const e = $(el),
        m = clean(e.find("p.text-gray").first().text()).match(
          /^(.+?)\s*·\s*(\d+(?:\.\d+)?)%/,
        );
      if (m && /Draft/.test(e.text()))
        add(
          e.find("h3").text(),
          m[1],
          +m[2],
          e.find("p.text-right").first().text(),
        );
    });
  }
  return out;
}
