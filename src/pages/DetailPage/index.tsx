import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Loading } from '../../assets/Loading';
import { LessThan } from '../../assets/LessThan';
import { GreaterThan } from '../../assets/GreaterThan';
import { ArrowLeft } from '../../assets/ArrowLeft';
import { Balance } from '../../assets/Balance';
import { Vector } from '../../assets/Vector';
import Type from '../../components/Type';
import BaseStat from '../../components/BaseStat';
import DamageRelations from '../../components/DamageRelations';
import DamageModal from '../../components/DamageModal';
import { FormattedPokemonData } from '../../types/FormattedPokemonData';
import { Ability, PokemonDetail, Sprites } from '../../types/PokemonDetail';
import { DamageRelationOfPokemonType } from '../../types/DamageRelationOfPokemonTypes';
import { FlavorTextEntry, PokemonDescription } from '../../types/PokemonDescription';
import { PokemonData } from '../../types/PokemonData';

interface SpeciesResponse {
  evolution_chain: { url: string }
  flavor_text_entries: [{
      flavor_text: string,
      language: { name: string }
  }]
}

interface nextAndPreviousPokemon {
  next: string | undefined;
  previous: string | undefined;
}

interface EvolutionChain {
  evolves_to: Array<EvolutionChain>,
  species: { name: string, url: string }
}

interface EvolutionChainResponse {
  chain: {
      evolves_to: Array<EvolutionChain>,
      species: { name: string, url: string }
  }
}


const DetailPage = () => {

  const [pokemon, setPokemon] = useState<FormattedPokemonData>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const params = useParams() as {id: string};
  const pokemonId = params.id;
  const baseUrl = `https://pokeapi.co/api/v2/pokemon/`;

  useEffect(() => {
    setIsLoading(true);
    fetchPokemonData(pokemonId);
  }, [pokemonId])
  

  async function fetchPokemonData(id: string) {
    const url = `${baseUrl}${id}`
    try{
        const {data: pokemonData} = await axios.get<PokemonDetail>(url);

        if(pokemonData) {
          const { name, id, types, weight, height, stats, abilities, sprites} = pokemonData;
          console.log(sprites)
          const nextAndPreviousPokemon: nextAndPreviousPokemon = await getNextAndPreviousPokemon(id);

          const DamageRelations = await Promise.all(
            types.map(async (i) => {
              const type = await axios.get<DamageRelationOfPokemonType>(i.type.url);
              return type.data.damage_relations
            })
          )
          DamageRelations
          const flavorText = await getFlavorTextAndURL(nextPokemon);
          const evolution = await getEvolutionChain(flavorText.evolution_chain_url);          
          const formattedPokemonData: FormattedPokemonData = {
            id,
            name: await getPokemonName(id),
            weight: weight/10,
            height: height/10,
            previous: nextAndPreviousPokemon.previous,
            next: nextAndPreviousPokemon.next,
            abilities: formatPokemonAbilities(abilities),
            stats: formatPokemonStats(stats),
            DamageRelations,
            types: types.map(type => type.type.name),
            sprites:formatPokemonSprites(sprites),
            description: await getPokemonDescription(id),
            evolution: evolution

          
          }
          // console.log('@@@@@@', JSON.stringify(formattedPokemonData));
        setPokemon(formattedPokemonData);
        setIsLoading(false)
        console.log(formattedPokemonData);

        }
    } catch(error) {
        console.error(error);
        setIsLoading(false);

    }
  }
//진화관련
const getFlavorTextAndURL = async (id: number) => {
  const speciesData: SpeciesResponse = await axios.get(`https://pokeapi.co/api/v2/pokemon-species/${id}/`).then(
      res => res.data
  )
  const index = speciesData.flavor_text_entries.find(val => {
      return val.language.name === "en";
  });

  const flavor_text = index ? index.flavor_text : "No features";
  return { text: flavor_text, evolution_chain_url: speciesData.evolution_chain.url };
}

  // 이름 한글로 변환한거 필터, 맵을 통해 names에 있는 ko 한국이름을 찾아 반환 문자열이라[0]반환
  const filterAndFormatName = (name) => {
    const koreanNames = name
      ?.filter((text) => text.language.name === 'ko')
      .map((text) => text.name.replace(/\r|\n|\f/g, ' '))
      return koreanNames[0];
  }

  const filterAndFormatDescription = (flavorText: FlavorTextEntry[]) : string[] => {
    const koreanDescriptions = flavorText
      ?.filter((text: FlavorTextEntry) => text.language.name === 'ko')
      .map((text: FlavorTextEntry) => text.flavor_text.replace(/\r|\n|\f/g, ' '))
    return koreanDescriptions;
  }
  //pokemonSpecies중 names을 끌어옴
  const getPokemonName = async (id:number) => {
    const url = `https://pokeapi.co/api/v2/pokemon-species/${id}/`

    const {data: pokemonSpecies} = await axios.get(url)
    //  console.log(pokemonSpecies);

    const name = filterAndFormatName(pokemonSpecies.names)
    return name || pokemonSpecies.name;
  }
  // 진화
  const getPokemonDescription = async (id:number): Promise<string> => {
    const url = `https://pokeapi.co/api/v2/pokemon-species/${id}/`

    const {data: pokemonSpecies} = await axios.get<PokemonDescription>(url)

    const descriptions: string[] = filterAndFormatDescription(pokemonSpecies.flavor_text_entries)
    return descriptions[Math.floor(Math.random() * descriptions.length)]
  }

  const getEvolutionChain = async (url: string) => {
    const evolutionChain: EvolutionChainResponse = await axios.get(url).then(
        res => res.data
    )
    const chain = evolutionChain.chain;
    const evolutionSequence: Array<Array<EvolutionDTO>> = [];
    
    // 형식에서 벗어난 유일한 포켓몬
    if(url === "https://pokeapi.co/api/v2/evolution-chain/135/"){
        evolutionSequence.push([{ id: Number(chain.species.url.split("/")[6]), name: chain.species.name }]);
        evolutionSequence.push([
            { id: Number(chain.evolves_to[0].species.url.split("/")[6]), 
                name: chain.evolves_to[0].species.name },
            { id: Number(chain.evolves_to[1].species.url.split("/")[6]), 
                name: chain.evolves_to[1].species.name 
            }]);
        evolutionSequence.push([
            { id: Number(chain.evolves_to[0].evolves_to[0].species.url.split("/")[6]), 
                name: chain.evolves_to[0].evolves_to[0].species.name},
            { id: Number(chain.evolves_to[1].evolves_to[0].species.url.split("/")[6]), 
                name: chain.evolves_to[1].evolves_to[0].species.name}
        ]); 
    }
    else {
        //초기
        evolutionSequence.push([{ id: Number(chain.species.url.split("/")[6]), name: chain.species.name }]);
        //1번째 진화
        if (chain.evolves_to.length > 0) {
            const evolutionPart: Array<EvolutionDTO> = [];
            chain.evolves_to.map(val => {
                evolutionPart.push({
                    id: Number(val.species.url.split("/")[6]),
                    name: val.species.name
                });
            })

            evolutionSequence.push(evolutionPart);

            //2번째 진화
            if (chain.evolves_to[0].evolves_to.length > 0) {
                const evolutionPart: Array<EvolutionDTO> = [];
                chain.evolves_to[0].evolves_to.map(val => {
                    evolutionPart.push({
                        id: Number(val.species.url.split("/")[6]),
                        name: val.species.name
                    });
                })
                evolutionSequence.push(evolutionPart);
            }
        }
    }
    return evolutionSequence;
}
  // 그림
  const formatPokemonSprites = (sprites:Sprites) => {

    const newSprites = { ...sprites};


    (Object.keys(newSprites) as (keyof typeof newSprites)[]).forEach(key => {
      if(typeof newSprites[key] !== 'string') {
          delete newSprites[key];
      }
    });

    return Object.values(newSprites) as string[];
    

  }
  //지역별 분류
  const getRegions = (id: number): Regions => {
    if (id <= 151) {
        return "Kanto";
    }
    else if (id <= 251) {
        return "Johto";
    }
    else if (id <= 386) {
        return "Hoenn";
    }
    else if (id <= 493) {
        return "Sinnoh";
    }
    else if (id <= 649) {
        return "Unova";
    }
    else if (id <= 721) {
        return "Kalos";
    }
    else if (id <= 807) {
        return "Alola";
    }
    else {
        return "All";
    }
}

  const formatPokemonStats =([
    statHP,
    statATK,
    statDEP,
    statSATK,
    statSDEP,
    statSPD
  ]: Stat[]) => [
    {name: 'Hit Points', baseStat: statHP.base_stat},
    {name: 'Attack', baseStat: statATK.base_stat},
    {name: 'Defense', baseStat: statDEP.base_stat},
    {name: 'Special Attack', baseStat: statSATK.base_stat},
    {name: 'Special Defense', baseStat: statSDEP.base_stat},
    {name: 'Speed', baseStat: statSPD.base_stat}
  ]

  const formatPokemonAbilities = (abilities: Ability[]) => {
    return abilities.filter(( _, index) => index <= 1)
                    .map((obj: Ability) => obj.ability.name.replaceAll('-', ' '))
  }

  async function getNextAndPreviousPokemon(id: number) {
    const urlPokemon = `${baseUrl}?limit=1&offset=${id - 1}`;

    const {data: pokemonData} = await axios.get(urlPokemon);

    await axios.get(urlPokemon)
    
    const nextResponse = pokemonData.next && (await axios.get<PokemonData>(pokemonData.next))

    const previousResponse = pokemonData.previous && (await axios.get<PokemonData>(pokemonData.previous))

    // console.log('previousResponse',previousResponse)

    return{
      next: nextResponse?.data?.results?.[0]?.name,
      previous: previousResponse?.data?.results?.[0]?.name
    }
  }

    if(isLoading) {
      return (
        <div className={
          `absolute h-auto w-auto top-1/3 -translate-x-1/2 left-1/2 z-50`
        }>
          <Loading className='w-12 h-12 z-50 animate-spin text-slate-900'/>
        </div>)
    }

    if(!isLoading && !pokemon){
      return(
        <div>...NOT FOUND</div>
      )
    }

  const img = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon?.id}.png`;
  const bg = `bg-${pokemon?.types?.[0]}`;
  const text = `text-${pokemon?.types?.[0]}`;
  // console.log(pokemon.stats);
  if(!isLoading && pokemon) {
  return (
    <article className='flex items-center gap-1 flex-col w-full'>
      <div
        className={
          `${bg} w-auto h-full flex flex-col z-0 items-center justify-end relative overflow-hidden`
        }
        >
          {pokemon?.previous && (
            <Link 
              className='absolute top-[40%] -translate-y-1/2 z-50 left-1'
              to={`/pokemon/${pokemon.previous}`}
            >
              <LessThan className='w-5 h-8 p-1'/>
            </Link>
          )}
            {pokemon?.next && (
            <Link 
              className='absolute top-[40%] -translate-y-1/2 z-50 right-1'
              to={`/pokemon/${pokemon.next}`}
            >
              <GreaterThan className='w-5 h-8 p-1' />
            </Link>
          )}

              <section className='w-full flex flex-col z-20 items-center justify-end relative h-full'>
                <div className='absolute z-30 top-6 flex items-center w-full justify-between px-2'>
                  <div className='flex items-center gap-1'>
                    <Link to= "/">
                      <ArrowLeft className='w-6 h-8 text-zinc-200'/>
                    </Link>
                    <h1 className='text-zinc-200 font-bold text-xl capitalize'>
                      {pokemon?.name}
                    </h1>
                  </div>
                  <div className='text-zinc-200 font-bold text-md'>
                    #{pokemon?.id.toString().padStart(3,'00')}
                  </div>
                </div>
 

                <div className='relative h-auto max-w-[15.5rem] z-20 mt-6 -mb-16 '>
                  <img
                    src={img}
                    width="100%"
                    height="auto"
                    loading='lazy'
                    alt={pokemon.name}
                    className={`object-contain h-full`}
                    onClick={() => setIsModalOpen(true)}
                    />
                </div>

              </section>

              <section className='w-full min-h-[65%] h-full bg-gray-800 z-10 pt-14 flex flex-col items-center gap-3 px-5 pb-4'>

                <div className='flex items-center justify-center gap-4'>
                  {pokemon.types.map((type) => (
                    <Type key={type} type={type} />
                  ))}
                </div>
                <h2 className={`text-base font-semibold ${text}`}>
                {pokemon.name}
                </h2>
                <h2 className={`text-base font-semibold ${text}`}>
                  정보
                </h2>
                  <div className='flex w-full items-center justify-between max-w-[400px] text-center'>
                    <div className='w-full'>
                      <h4 className='text-[0.5rem] text-zinc-100'>Weight</h4>
                      <div className='text-sm flex mt-1 gap-2 justify-center text-zinc-200'>
                        <Balance />
                        {pokemon.weight}kg
                      </div>
                      
                    </div>
                    <div className='w-full'>
                      <h4 className='text-[0.5rem] text-zinc-100'>Height</h4>
                      <div className='text-sm flex mt-1 gap-2 justify-center text-zinc-200'>
                        <Vector />
                        {pokemon.height}m
                      </div>
                      
                    </div>
                    <div className='w-full'>
                      <h4 className='text-[0.5rem] text-zinc-100'>Ability</h4>
                        {pokemon.abilities.map((ability) => (
                           <div key={ability} className='text-[0.5rem] text-zinc-100 capitalize'>{ability}</div>
                        ))}
                    </div>
                  </div>

                  <h2 className={`text-base font-semibold ${text}`}>
                    기본능력치
                   </h2>
                  <div className='w-full flex justify-center'>
                    <table>
                      <tbody>
                        {pokemon.stats.map((stat) =>(
                            <BaseStat
                              key={stat.name}
                              valueStat= {stat.baseStat}
                              nameStat={stat.name}
                              type={pokemon.types[0]}
                               />
                        ))}
                      </tbody>
                    </table>
                  </div>

                          <h2 className= {`text-base font-semibold ${text}`}>
                            설명
                          </h2>
                          <p className='text-md leading-4 font-sans text-zinc-200 max-w-[30rem] text-center'>
                            {pokemon.description}
                          </p>

                    <div className='flex my-8 flex-wrap justify-center'>
                            {pokemon.sprites.map((url, index) => (
                              <img
                                key= {index}
                                src= {url}
                                alt='sprite'
                                />
                            ))}

                    </div>

    

              </section>

              
           </div>
           {isModalOpen && 
                <DamageModal 
                    setIsModalOpen = {setIsModalOpen}  
                    damages={pokemon.DamageRelations}
                /> 
              }
      </article>
  )
  }
  return null;
}

export default DetailPage