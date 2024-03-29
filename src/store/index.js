import {
  configureStore,
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";
import { API_KEY, TMDB_BASE_URL } from "../utils/constants";
import axios from "axios";

const initialState = {
  movies: [],
  genresLoaded: false,
  genres: [],
};

export const getGenres = createAsyncThunk("netflix/genres", async () => {
  try {
    const { data: { genres } } = await axios.get("https://api.themoviedb.org/3/genre/movie/list?api_key=9aa63896c9a7b609872600760a3a61f7");
    console.log("Genres from API:", genres);
    return genres;
  } catch (error) {
    console.error("Error fetching genres:", error);
    throw error;
  }
});

const createArrayFromRawData = (array, moviesArray, genres) => {
  //console.log(array);
  array.forEach((movie) => {
    const movieGenres = [];
    movie.genre_ids.forEach((genre) => {
      const name = genres.find(({ id }) => id === genre);
      if (name) movieGenres.push(name.name);
    });
    if (movie.backdrop_path)
      moviesArray.push({
        id: movie.id,
        name: movie?.original_name ? movie.original_name : movie.original_title,
        image: movie.backdrop_path,
        genres: movieGenres.slice(0, 3),
      });
  });
};

const getRawData = async (api, genres, paging = false) => {
  const moviesArray = [];

  try {
    for (let i = 1; moviesArray.length < 60 && i < 10; i++) {
      const {
        data: { results },
      } = await axios.get(`${api}${paging ? `&page=${i}` : ""}`);
      createArrayFromRawData(results, moviesArray, genres);
    }
  } catch (error) {
    console.error("Error fetching raw data:", error);
    // You can throw the error if you want to propagate it further
    throw error;
  }

  return moviesArray;
};


export const fetchMovies = createAsyncThunk(
  "netflix/trending",
  async ({ type }, thunkAPI) => {
    const {
      netflix: { genres },
    } = thunkAPI.getState();
    
    // Fetch movies data
    const moviesData = await getRawData(
      `${TMDB_BASE_URL}/trending/${type}/week?api_key=${API_KEY}`,
      genres,
      true
    );

    // Log movies array content
    console.log("Movies Array:", moviesData);

    return moviesData;
  }
);
//return getRawData(`${TMDB_BASE_URL}/discover/${type}?api_key=${API_KEY}$with_genres=${}`)

const NetflixSlice = createSlice({
  name: "netflix",
  initialState,
  extraReducers: (builder) => {
    builder.addCase(getGenres.fulfilled, (state, action) => {
      state.genres = action.payload;
      state.genresLoaded = true;
    });
  },
});

export const store = configureStore({
  reducer: {
    netflix: NetflixSlice.reducer,
  },
});
