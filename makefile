all: n-over-1.pdf

n-over-1.book.html: n-over-1.html n-over-1.js n-over-1.css
	# Invoke Chromium with <=768 width so TOC has one column instead of two.
	chromium --headless --window-size=768,600 --dump-dom n-over-1.html | \
		grep -vE 'n-over-1.js|n-over-1.css' > $@

n-over-1.pdf: n-over-1.book.html n-over-1.css n-over-1.book.css \
	            封面.svg  无将定约.svg  有将定约.svg
	weasyprint -s n-over-1.css -s n-over-1.book.css n-over-1.book.html $@

