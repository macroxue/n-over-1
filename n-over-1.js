var use_horizontal_layout = false;
var nav_scroll_top = 0;
var parser = new DOMParser();

function initialize() {
  url_params = new URLSearchParams(window.location.search);
  if (url_params.has('h')) {
    use_horizontal_layout = true;
  }

  // Simple rendering first so the DOM doesn't get bloated for later rendering.
  render_text();
  render_inline_hands();
  render_external_links();
  render_md_tables();
  render_md_auctions();
  window.onresize();

  // Close TOC navigation after a click.
  const nav = document.getElementById('nav');
  const nav_div = document.getElementById('nav-div');
	document.addEventListener('click', function(event) {
    if (nav.open) {
      // Save the scroll position.
      nav_scroll_top = nav_div.scrollTop;
      // Close the navigation, except when it's closed by a click on the summary.
      if (!(event.target.nodeName == 'SUMMARY' && event.target.parentNode == nav))
        nav.removeAttribute('open');
    }
  });
  nav.addEventListener('toggle', (event) => {
    // Restore the previous scroll position.
    if (nav.open) nav_div.scrollTop = nav_scroll_top;
  });
}

window.onresize = function() {
  small_screen = window.matchMedia("(max-width: 768px)").matches;
  // outerWidth,outerHeight must match --window-size in the makefile.
  book = (window.outerWidth == 1234 && window.outerHeight == 567);
  document.getElementById('toc').style.columns = small_screen || book ? '1' : '2';
  columns = document.getElementsByClassName('column');
  for (column of columns) {
    column.style.columns = small_screen && !book ? '1' : '2';
  }
};

function render_text() {
  walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
  headings = [];
  while (walker.nextNode()) {
    if (walker.currentNode.tagName.match(/^H[2-4]$/)) {
      walker.currentNode.id = 'heading_' + headings.length;
      headings.push('<a class="toc_' + walker.currentNode.tagName.toLowerCase() +
                    '" href="#' + walker.currentNode.id + '">' +
                    walker.currentNode.innerHTML + '</a><br>');
    }
    if (walker.currentNode.tagName.match(/^(H[5-6]|P|LI)$/)) {
      html = transform(walker.currentNode.innerHTML);
      walker.currentNode.innerHTML = html;
    }
  }

  document.getElementById('toc').innerHTML = headings.join('\n');
  document.getElementById('nav').innerHTML += headings.join('\n');
}

function render_external_links() {
  links = document.getElementsByClassName('external');
  for (link of links) {
    href = link.getAttribute('href');
    new_node = document.createElement("span");
    new_node.setAttribute('class', 'footnote');
    new_node.innerHTML = href;
    link.after(new_node);
  }
}

function render_inline_hands() {
  hands = document.getElementsByClassName('inline-hand');
  for (hand of hands) {
    hand.innerHTML = hand_to_html_line(remove_suit_symbol(hand.innerHTML));
  }
}

function transform(text) {
  return text
    .replace(/(\bS\b|♠)/g, '<ss></ss>')
    .replace(/(\bH\b|♥)/g, '<hs></hs>')
    .replace(/(\bD\b|♦)/g, '<ds></ds>')
    .replace(/(\bC\b|♣)/g, '<cs></cs>')
    .replace(/([1-7])([SHDC])\b/g, '$1<$2s></$2s>')
    .replace(/\b([SHDC])([2-9TJQKA]+\b)/g, '<$1s></$1s>$2')
    .replace(/__(.*?)__/g, '<u>$1</u>')
    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
    .replace(/, /g, '，');
}

function render_md_auctions() {
  md_auctions = document.getElementsByClassName('md-auction');
  for (md_auction of md_auctions) {
    new_node = document.createElement("div");
    new_node.innerHTML = render_md_auction(md_auction);
    md_auction.parentNode.insertBefore(new_node, md_auction);
  }
}

function render_md_auction(md_auction) {
  xml_doc = parser.parseFromString(md_auction.innerHTML, "text/xml");
  root = xml_doc.getElementsByTagName('xml')[0];
  style = root.getAttribute('style');
  rows = transform(root.childNodes[0].nodeValue).split('\n').slice(1, -1);
  if (rows[0].split('|').length == 2)
    return render_pair_auction(rows);
  else
    return render_full_auction(rows);
}

function align_bid_cmt(bid_cmt) {
  return bid_cmt.replace(/^/, '<span class="bid">').replace(/ - |$/, '</span>');
}

function render_pair_auction(rows) {
  hands = ['', ''];
  for (row of rows.slice(0, 4)) {
    suits = row.split('|');
    hands[0] += remove_suit_symbol(suits[0]) + ' ';
    hands[1] += remove_suit_symbol(suits[1]) + ' ';
  }
  bids = ['', '', '', ''];
  for (row of rows.slice(4)) {
    items = row.trim().split('|').map(b => align_bid_cmt(b));
    bids[0] = bids[0] == '' ? items[0] : bids[0] + '<br/>' + items[0];
    if (items.length > 1)
      bids[1] = bids[1] == '' ? items[1] : bids[1] + '<br/>' + items[1];
    if (items.length > 2)
      bids[2] = bids[2] == '' ? items[2] : bids[2] + '<br/>' + items[2];
    if (items.length > 3)
      bids[3] = bids[3] == '' ? items[3] : bids[3] + '<br/>' + items[3];
  }
  bid1_class = (bids[2] == '' ? 'bid-cmt' : 'bid-cmt2');
  if (use_horizontal_layout) {
    // Horizontal layout.
    return '<table class="auction">' +
      '<tr>' + hand_to_html(hands[0]) + hand_to_html(hands[1]) +
      '<td class="bid-cmt">' + bids[0] + '</td>' +
      '<td class="' + bid1_class + '">' + bids[1] + '</td>' +
      (bids[2] == '' ? '' : '<td class="bid-cmt">' + bids[2] + '</td>') +
      (bids[3] == '' ? '' : '<td class="bid-cmt2">' + bids[3] + '</td>') +
      '</tr> </table>';
  } else {
    // Vertical layout.
    colspan = (bids[2] == '' ? 1 : 2);
    html = '<table class="auction"> <tr>' + hand_to_html(hands[0], colspan) +
      '<td class="orientation">┌─┐<br>西&emsp;东<br>└─┘</td>' +
      hand_to_html(hands[1], colspan) + '</tr>';
    if (bids[0] != '') {
      html += '<tr>' + '<td class="bid-cmt" colspan="2">' + bids[0] + '</td>' +
        '<td class="' + bid1_class + '">' + bids[1] + '</td>' +
        (bids[2] == '' ? '' : '<td class="bid-cmt">' + bids[2] + '</td>') +
        (bids[3] == '' ? '' : '<td class="bid-cmt2">' + bids[3] + '</td>') +
        '</tr>';
    }
    return html + '</table>';
  }
}

function render_full_auction(rows) {
  info = '';
  hands = ['', '', '', ''];
  for (row of rows.slice(0, 4)) {
    suits = row.split('|');
    info += suits[0] + '<br/>';
    hands[1] += remove_suit_symbol(suits[1]) + ' ';
  }
  for (row of rows.slice(4, 8)) {
    suits = row.split('|');
    hands[0] += remove_suit_symbol(suits[0]) + ' ';
    hands[2] += remove_suit_symbol(suits[2]) + ' ';
  }
  for (row of rows.slice(8, 12)) {
    suits = row.split('|');
    hands[3] += remove_suit_symbol(suits[1]) + ' ';
  }
  bids = ['', '', '', ''];
  for (row of rows.slice(12)) {
    items = row.split('|');
    bids[0] = bids[0] == '' ? items[0] : bids[0] + '<br/>' + items[0];
    if (items.length > 1)
      bids[1] = bids[1] == '' ? items[1] : bids[1] + '<br/>' + items[1];
    if (items.length > 2)
      bids[2] = bids[2] == '' ? items[2] : bids[2] + '<br/>' + items[2];
    if (items.length > 3)
      bids[3] = bids[3] == '' ? items[3] : bids[3] + '<br/>' + items[3];
  }
  layout = '<table class="auction">' +
   '<tr> <td>' + info + '</td>' + hand_to_html(hands[1]) + '</tr>' +
    '<tr> ' + hand_to_html(hands[0]) +
    '<td class="orientation">┌ 北 ┐<br>西&emsp;&emsp;东<br>└ 南 ┘</td>' +
    hand_to_html(hands[2]) + '</tr>' +
    '<tr> <td></td>' + hand_to_html(hands[3]) + '</tr>' +
    '</table>';
  auction = '<table>' +
    '<td class="bid-cmt">' + bids[0] + '</td>' +
    '<td class="bid-cmt">' + bids[1] + '</td>' +
    '<td class="bid-cmt">' + bids[2] + '</td>' +
    '<td class="bid-cmt">' + bids[3] + '</td>' +
    '</table>';
  return '<table> <td>' + layout + '</td> <td>' + auction + '</td>';
}

function remove_suit_symbol(suit) {
  return suit.replace(/<[shdc\/<>]*> /g, '').trim();
}

function render_md_tables() {
  md_tables = document.getElementsByClassName('md-table');
  for (md_table of md_tables) {
    new_node = document.createElement("div");
    new_node.innerHTML = render_md_table(md_table);
    md_table.parentNode.insertBefore(new_node, md_table);
  }
}

function render_md_table(md_table) {
  xml_doc = parser.parseFromString(md_table.innerHTML, "text/xml");
  root = xml_doc.getElementsByTagName('xml')[0];
  style = root.getAttribute('style');
  font_size = root.getAttribute('font-size');
  rows = transform(root.childNodes[0].nodeValue).split('\n');
  if (font_size == null) {
    html = '<table class="' + style + '">';
  } else {
    html = '<table class="' + style + '" style="font-size:' + font_size + '">';
  }
  for (i in rows) {
    if (rows[i].trim() == '') continue;
    html += '<tr>';
    for (cell of rows[i].split('|')) {
      html += render_cell(cell, i == 1);
    }
    html += '</tr>';
  }
  return html + '</table>';
}

function render_cell(cell, is_header) {
  regex = /\\[2-9ftb]/g;
  formats = cell.match(regex);
  attr = '';
  if (formats) {
    formats = formats.sort();
    border = 'no';
    for (format of formats) {
      if (format[1] == 'b') {
        border += '-bot';
      } else if (format[1] == 't') {
        border += '-top';
      } else if (format[1] == 'f') {
        attr += ' class="fill"';
      } else if (2 <= format[1] && format[1] <= 9) {
        attr += ' colspan=' + format[1];
      }
    }
    if (border != 'no')
      attr += ' class="' + border + '"';
  }
  cell = cell.replace(regex, '');
  if (cell.match(/<ss>.* <hs>.* <ds>.* <cs>.* /)) {
    cell = remove_suit_symbol(cell);
    cell = hand_to_html_line(cell);
  }
  if (is_header) {
    return '<th ' + attr + '>' +  cell + '</th>';
  } else {
    return '<td ' + attr + '>' +  cell + '</td>';
  }
}

function check_hand(hand) {
  cards = hand.replace(/[ -]/g, '');
  if (cards.length != 13)
    console.log('ERROR: ' + cards.length + ' cards with ' + hand);
  if (cards.match(/[x2-9TJQKA]/g).length != 13)
    console.log('ERROR: invalid cards in ' + hand);
}

function count_points(hand) {
  hcp = 0;
  for (card of hand) {
    hcp += (card == 'A') * 4 + (card == 'K') * 3 +
           (card == 'Q') * 2 + (card == 'J') * 1;
  }
  return hcp;
}

function space_cards(suit) {
  return suit.replace(/./g, function (x) { return '&thinsp;' + x; })
    .replace(/\bJ\b/g, '&hairsp;&hairsp;J&hairsp;')
    .replace(/\b(T|10)\b/g, '<font style="letter-spacing:-2px">1</font>0');
}

function hand_to_html(hand, colspan=1) {
  check_hand(hand);
  hcp = count_points(hand);

  suits = hand.replace(/10/g, 'T').split(' ');
  for (s in suits) {
    len = suits[s].length;
    suits[s] = space_cards(suits[s]);
    if (len >= 8) {
      space = len <= 9 ? -1 : -2;
      suits[s] = '<font style="letter-spacing:' + space + 'px">' + suits[s] + '</font>';
    }
  }
  html = `
     <td class='hand' colspan='${colspan}'>
       <abbr title='${hcp}大牌点'>
         <ss>S</ss> <br/>
         <hs>H</hs> <br/>
         <ds>D</ds> <br/>
         <cs>C</cs> <br/>
       </abbr>
     </td>`;
  return html
    .replace(/\bS\b/, suits[0])
    .replace(/\bH\b/, suits[1])
    .replace(/\bD\b/, suits[2])
    .replace(/\bC\b/, suits[3]);
}

function small_space_cards(suit) {
  return suit.replace(/./g, function (x) { return '&hairsp;' + x; })
    .replace(/\bJ\b/g, '&hairsp;J&hairsp;')
    .replace(/\b(T|10)\b/g, '<font style="letter-spacing:-2px">1</font>0');
}

function hand_to_html_line(hand) {
  check_hand(hand);
  hcp = count_points(hand);

  suits = hand.replace(/10/g, 'T').split(' ');
  for (s in suits) {
    suits[s] = small_space_cards(suits[s]);
  }
  html = `
       <abbr title='${hcp}大牌点'>
         <ss>S</ss> <hs>H</hs> <ds>D</ds> <cs>C</cs>
       </abbr>`;
  return html
    .replace(/\bS\b/, suits[0])
    .replace(/\bH\b/, suits[1])
    .replace(/\bD\b/, suits[2])
    .replace(/\bC\b/, suits[3]);
}

