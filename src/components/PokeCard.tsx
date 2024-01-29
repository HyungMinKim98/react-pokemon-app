import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { LazyImage } from './Lazyimage';
import { Link } from 'react-router-dom';
import { PokemonNameAndUrl } from '../types/PokemonData';
import { PokemonDetail } from '../types/PokemonDetail';

interface PokeData {
  id: number;
  type: string;
  name: string;
}

export const PokeCard = ({url, name}: PokemonNameAndUrl) => {
  const [pokemon, setPokemon] = useState<PokeData>();

  const filterAndFormatName = (name) => {
    const koreanNames = name
      ?.filter((text) => text.language.name === 'ko')
      .map((text) => text.name.replace(/\r|\n|\f/g, ' '))
      return koreanNames[0];
  }

  const getPokemonName = async (id) => {
    const url = `https://pokeapi.co/api/v2/pokemon-species/${id}/`

    const {data: pokemonSpecies} = await axios.get(url)

    const name = filterAndFormatName(pokemonSpecies.names)
    return name || pokemonSpecies.name;
  }

  useEffect(() => {
    fetchPokeDetailData();
  }, [])
  
  const fetchPokeDetailData = async () => {
    try{
      const response = await axios.get(url);
      const pokemonData = await formatPokemonData(response.data);
      setPokemon(pokemonData);
    } catch (error) {
      console.error(error);
    }
  }

  const formatPokemonData = async (params: PokemonDetail) => {
    const {id, types} = params;
    const name = await getPokemonName(id);
    const PokeData:PokeData ={
      id,
      name,
      type: types[0].type.name
    }
    return PokeData;
  }

  const bg = `bg-${pokemon?.type}`;
  const border = `border-${pokemon?.type}`;
  const text = `text-${pokemon?.type}`;

  const img = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon?.id}.png`;
  
  return (
   <>
      {pokemon &&
        <Link
            to={`/pokemon/${name}`}
            className={`box-border rounded-lg ${border} w-[8.5rem] h-[8.5rem] z-0 bg-slate-800 justify-between items-center`}
        >
          <div
            className={`${text} h-[1.5rem] text-xs w-full pt-1 px-2 text-right rounded-t-lg`}
            >
              #{pokemon.id.toString().padStart(3,'00')}
            </div>
            <div className= {`w-full f-6 flex items-center justify-center`}>
              <div
               className={`box-border relative flex w-full h-[5.5rem] basis justify-center items-center`}
              >
                <LazyImage 
                    url={img}
                    alt={name}
                  />
              </div>
            </div>
            <div
              className = {`${bg} text-center text-xs text-zinc-100 h-[1.5rem] rounded-b-lg uppercase font-medium pt-1 `}

            >
              {pokemon.name}
              
            </div>
        </Link>
     }
   </>
  )
}

export default PokeCard
