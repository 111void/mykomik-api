import express from 'express';
import axios from 'axios';
import { load } from 'cheerio';  
import cors from 'cors';

const app = express();
const PORT = 3000;

app.use(cors());

// ==================== MANHWA ENDPOINTS ====================

// GET POPULAR MANHWA
app.get('/api/manhwa-popular', async (req, res) => {
  try {
    const url = 'https://kiryuu.one/manga/?type=manhwa&order=popular';
    const { data } = await axios.get(url);
    const $ = load(data);

    const results = [];
    
    $('.bs').each((index, element) => {
      const title = $(element).find('.tt').text().trim();
      const chapter = $(element).find('.epxs').text().trim();
      const rating = $(element).find('.numscore').text().trim();
      const imageSrc = $(element).find('img').attr('src');
      const link = $(element).find('a').attr('href');
      
      results.push({
        title,
        chapter,
        rating,
        imageSrc,
        link
      });
    });

    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error occurred while scraping data');
  }
});

// GET MANHWA RECOMMENDATIONS
app.get('/api/manhwa-recommendation', async (req, res) => {
  try {
    const urls = [
      'https://kiryuu.one/manga/?page=2&type=manhwa&order=popular',
      'https://kiryuu.one/manga/?page=3&type=manhwa&order=popular'
    ];

    const allResults = [];

    for (const url of urls) {
      const { data } = await axios.get(url);
      const $ = load(data);

      $('.bs').each((index, element) => {
        const title = $(element).find('.tt').text().trim();
        const chapter = $(element).find('.epxs').text().trim();
        const rating = $(element).find('.numscore').text().trim();
        const imageSrc = $(element).find('img').attr('src');
        const link = $(element).find('a').attr('href');

        allResults.push({
          title,
          chapter,
          rating,
          imageSrc,
          link
        });
      });
    }

    res.json(allResults);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error occurred while scraping data');
  }
});

// GET NEW MANHWA
app.get('/api/manhwa-new', async (req, res) => {
  try {
    const url = 'https://kiryuu.one/';
    const { data } = await axios.get(url);
    const $ = load(data);

    const results = [];
    
    $('.utao').each((index, element) => {
      const title = $(element).find('.luf h4').text().trim();
      const link = $(element).find('.luf a.series').attr('href');
      const imageSrc = $(element).find('.imgu img').attr('src');
      const chapters = [];
      
      const mangaList = $(element).find('.luf ul.Manga li');
      const manhwaList = $(element).find('.luf ul.Manhwa li');
      const manhuaList = $(element).find('.luf ul.Manhua li');
      const chapterElements = mangaList.length ? mangaList : manhwaList.length ? manhwaList : manhuaList;
      
      chapterElements.each((i, el) => {
        const chapterLink = $(el).find('a').attr('href');
        const chapterTitle = $(el).find('a').text().trim();
        const timeAgo = $(el).find('span').text().trim();
      
        chapters.push({
          chapterLink,
          chapterTitle,
          timeAgo
        });
      });
      
      results.push({
        title,
        link,
        imageSrc,
        chapters
      });
    });

    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error occurred while scraping data');
  }
});

// GET WEEKLY MANHWA RECOMMENDATIONS
app.get('/api/manhwa-recommend', async (req, res) => {
  try {
    const url = 'https://kiryuu.one/';
    const { data } = await axios.get(url);
    const $ = load(data);
    const recommendations = [];

    $('.serieslist.pop.wpop.wpop-weekly ul li').each((index, element) => {
      const item = {};
      const img = $(element).find('.imgseries img');
      
      item.rank = $(element).find('.ctr').text().trim();
      item.title = $(element).find('.leftseries h2 a').text().trim();
      item.url = $(element).find('.leftseries h2 a').attr('href');
      item.image = img.attr('src');
      item.genres = $(element).find('.leftseries span').text().replace('Genres: ', '').split(', ');
      item.rating = $(element).find('.numscore').text().trim();

      recommendations.push(item);
    });

    res.json(recommendations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching data' });
  }
});

// GET ONGOING MANHWA
app.get('/api/manhwa-ongoing', async (req, res) => {
  try {
    const url = 'https://kiryuu.one/manga/?status=ongoing&type=manhwa&order=';
    const response = await axios.get(url);
    const html = response.data;
    const $ = load(html);

    const manhwaList = [];

    $('.bs').each((index, element) => {
      const title = $(element).find('.bigor .tt').text().trim();
      const imageUrl = $(element).find('img').attr('src');
      const link = $(element).find('a').attr('href');
      const latestChapter = $(element).find('.epxs').text().trim();
      const rating = $(element).find('.numscore').text().trim();

      manhwaList.push({
        title,
        imageUrl,
        link,
        latestChapter,
        rating
      });
    });

    res.send(manhwaList);
  } catch (error) {
    res.status(500).send({
      message: 'Gagal mengambil data manhwa ongoing.',
      error: error.message
    });
  }
});

// GET MANHWA DETAIL
app.get('/api/manhwa-detail/:manhwaId', async (req, res) => {
  try {
    const manhwaId = req.params.manhwaId;
    const url = `https://kiryuu.one/manga/${manhwaId}`;
    const { data } = await axios.get(url);
    const $ = load(data);

    // Extract basic information
    const title = $('.seriestuheader .entry-title').text().trim();
    const imageSrc = $('.thumb img').attr('src');
    const rating = $('.rating .num').text().trim();
    const followedBy = $('.bmc').text().trim();
    const synopsis = $('.entry-content.entry-content-single').text().trim();

    // Extract first and latest chapter
    const firstChapterLink = $('.lastend .inepcx').first().find('a').attr('href');
    const firstChapterTitle = $('.lastend .inepcx').first().find('.epcurfirst').text().trim();
    const latestChapterLink = $('.lastend .inepcx').last().find('a').attr('href');
    const latestChapterTitle = $('.lastend .inepcx').last().find('.epcurlast').text().trim();

    // Extract details
    const status = $('tr:contains("Status")').find('td').eq(1).text().trim();
    const type = $('tr:contains("Type")').find('td').eq(1).text().trim();
    const released = $('tr:contains("Released")').find('td').eq(1).text().trim();
    const author = $('tr:contains("Author")').find('td').eq(1).text().trim();
    const artist = $('tr:contains("Artist")').find('td').eq(1).text().trim();
    const updatedOn = $('tr:contains("Updated On")').find('time').text().trim();

    // Extract genres
    const genres = [];
    $('.seriestugenre a').each((index, element) => {
      const genreName = $(element).text().trim();
      const genreLink = $(element).attr('href');
      genres.push({
        genreName,
        genreLink
      });
    });

    // Extract chapters list
    const chapters = [];
    $('#chapterlist li').each((index, element) => {
      const chapterNum = $(element).find('.chapternum').text().trim();
      const chapterLink = $(element).find('.eph-num a').attr('href');
      const chapterDate = $(element).find('.chapterdate').text().trim();
      const downloadLink = $(element).find('.dload').attr('href');

      chapters.push({
        chapterNum,
        chapterLink,
        chapterDate,
        downloadLink
      });
    });

    const manhwaDetails = {
      title,
      imageSrc,
      rating,
      followedBy,
      synopsis,
      firstChapter: {
        title: firstChapterTitle,
        link: firstChapterLink
      },
      latestChapter: {
        title: latestChapterTitle,
        link: latestChapterLink
      },
      status,
      type,
      released,
      author,
      artist,
      updatedOn,
      genres,
      chapters
    };

    res.json(manhwaDetails);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error occurred while scraping data');
  }
});

// ==================== GENRE ENDPOINTS ====================

// GET ALL GENRES
app.get('/api/genres', async (req, res) => {
  try {
    const url = 'https://kiryuu.one/manga/list-mode/';
    const { data } = await axios.get(url);
    const $ = load(data);

    const genres = [];

    $('.dropdown-menu.c4.genrez li').each((index, element) => {
      const genreLabel = $(element).find('label').text().trim();
      const genreValue = $(element).find('input').val();

      if (genreLabel && genreValue) {
        genres.push({ label: genreLabel, value: genreValue });
      }
    });

    res.json({ genres });
  } catch (error) {
    console.error('Error fetching data:', error.message);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// GET SERIES BY GENRE
app.get('/api/genre/:genreId', async (req, res) => {
  try {
    const { genreId } = req.params;
    const url = `https://kiryuu.one/genres/${genreId}`;
    const { data } = await axios.get(url);
    const $ = load(data);
    
    const seriesList = [];

    $('.bs').each((index, element) => {
      const series = {};
      const bsx = $(element).find('.bsx');

      series.title = bsx.find('a').attr('title');
      series.url = bsx.find('a').attr('href');
      series.image = bsx.find('img').attr('src');
      series.latestChapter = bsx.find('.epxs').text();
      series.rating = bsx.find('.numscore').text();

      seriesList.push(series);
    });

    // Extract pagination
    const pagination = [];
    $('.pagination a.page-numbers').each((index, element) => {
      const pageUrl = $(element).attr('href');
      const pageNumber = $(element).text();
      pagination.push({ pageUrl, pageNumber });
    });

    const nextPage = $('.pagination a.next.page-numbers').attr('href');

    res.json({ seriesList, pagination, nextPage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching data' });
  }
});

// GET SERIES BY GENRE WITH PAGINATION
app.get('/api/genre/:genreId/page/:pageNumber', async (req, res) => {
  try {
    const { genreId, pageNumber } = req.params;
    const url = `https://kiryuu.one/genres/${genreId}/page/${pageNumber}`;
    const { data } = await axios.get(url);
    const $ = load(data);
    
    const seriesList = [];

    $('.bs').each((index, element) => {
      const series = {};
      const bsx = $(element).find('.bsx');

      series.title = bsx.find('a').attr('title');
      series.url = bsx.find('a').attr('href');
      series.image = bsx.find('img').attr('src');
      series.latestChapter = bsx.find('.epxs').text();
      series.rating = bsx.find('.numscore').text();

      seriesList.push(series);
    });

    // Extract pagination (excluding navigation text)
    const pagination = [];
    $('.pagination a.page-numbers').each((index, element) => {
      const pageText = $(element).text().trim().toLowerCase();
      
      if (pageText !== '« sebelumnya' && pageText !== 'berikutnya »') {
        const pageUrl = $(element).attr('href');
        const pageNumber = $(element).text();
        pagination.push({ pageUrl, pageNumber });
      }
    });

    res.json({ seriesList, pagination });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching data' });
  }
});

// [ SEARCH ENDPOINTS ]

// SEARCH SERIES
app.get('/api/search/:searchId', async (req, res) => {
  try {
    const { searchId } = req.params;
    const url = `https://kiryuu.one/?s=${searchId}`;
    const { data } = await axios.get(url);
    const $ = load(data);
    
    const seriesList = [];

    $('.bs').each((index, element) => {
      const series = {};
      const bsx = $(element).find('.bsx');

      series.title = bsx.find('a').attr('title');
      series.url = bsx.find('a').attr('href');
      series.image = bsx.find('img').attr('src');
      series.latestChapter = bsx.find('.epxs').text();
      series.rating = bsx.find('.numscore').text();

      seriesList.push(series);
    });

    // Extract pagination
    const pagination = [];
    $('.pagination a.page-numbers').each((index, element) => {
      const pageUrl = $(element).attr('href');
      const pageNumber = $(element).text();
      pagination.push({ pageUrl, pageNumber });
    });

    const nextPage = $('.pagination a.next.page-numbers').attr('href');

    res.json({ seriesList, pagination, nextPage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching data' });
  }
});

// SEARCH SERIES WITH PAGINATION
app.get('/api/page/:pageNumber/search/:searchId', async (req, res) => {
  try {
    const { searchId, pageNumber } = req.params;
    const url = `https://kiryuu.one/page/${pageNumber}/?s=${searchId}`;
    const { data } = await axios.get(url);
    const $ = load(data);
    
    const seriesList = [];

    $('.bs').each((index, element) => {
      const series = {};
      const bsx = $(element).find('.bsx');

      series.title = bsx.find('a').attr('title');
      series.url = bsx.find('a').attr('href');
      series.image = bsx.find('img').attr('src');
      series.latestChapter = bsx.find('.epxs').text();
      series.rating = bsx.find('.numscore').text();

      seriesList.push(series);
    });

    // Extract pagination (excluding navigation text)
    const pagination = [];
    $('.pagination a.page-numbers').each((index, element) => {
      const pageText = $(element).text().trim().toLowerCase();
      
      if (pageText !== '« sebelumnya' && pageText !== 'berikutnya »') {
        const pageUrl = $(element).attr('href');
        const pageNumber = $(element).text();
        pagination.push({ pageUrl, pageNumber });
      }
    });

    res.json({ seriesList, pagination });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching data' });
  }
});

// [ CHAPTER ENDPOINTS ]

// READ CHAPTER
app.get('/api/chapter/:chapterId', async (req, res) => {
  try {
    const { chapterId } = req.params;
    const url = `https://kiryuu.one/${chapterId}`;
    const response = await axios.get(url);
    const html = response.data;
    const $ = load(html);

    // Extract chapter title
    const title = $('h1.entry-title').text().trim();

    // Delay function
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    await delay(1000);

    // Extract script containing ts_reader object
    const scriptContent = $('script').filter((i, el) => {
      return $(el).html().includes('ts_reader.run');
    }).html();

    // Extract JSON object from script
    const jsonString = scriptContent.match(/ts_reader\.run\((.*?)\);/)[1];
    const jsonObject = JSON.parse(jsonString);

    // Get images from the specified source
    const images = jsonObject.sources[0].images;

    // Extract navigation URLs
    const prevChapter = jsonObject.prevUrl || null;
    const nextChapter = jsonObject.nextUrl || null;

    // Extract chapter list from select element
    const chapters = [];
    $('.nvx #chapter option').each((index, element) => {
      const chapterTitle = $(element).text().trim();
      const chapterUrl = $(element).attr('value') || null;

      chapters.push({
        title: chapterTitle,
        url: chapterUrl
      });
    });

    // Extract navigation button URLs
    const prevButtonUrl = $('.ch-prev-btn').attr('href') || null;
    const nextButtonUrl = $('.ch-next-btn').attr('href') || null;

    res.json({
      title,
      images,
      prevChapter,
      nextChapter,
      chapters,
      prevButtonUrl,
      nextButtonUrl
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch chapter data' });
  }
});

// [ SERVER START ]

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});