export const dynamic='force-dynamic';
import Explorer from './explorer';
import {breweries} from '../lib';
export default function Home(){return <Explorer breweries={breweries}/>}
