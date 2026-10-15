"use client";
import {Tabs,TabsList,TabsTrigger,TabsContent} from "./ui/tabs";
import type {ReactNode} from "react";
export default function DiscoveryTabs({drops,taprooms,picks}:{drops:ReactNode;taprooms:ReactNode;picks:ReactNode}){
 return <Tabs defaultValue="drops" className="discovery-tabs"><TabsList aria-label="Discover New York"><TabsTrigger value="drops">New drops</TabsTrigger><TabsTrigger value="taprooms">Taprooms</TabsTrigger><TabsTrigger value="picks">Local picks</TabsTrigger></TabsList><TabsContent value="drops">{drops}</TabsContent><TabsContent value="taprooms">{taprooms}</TabsContent><TabsContent value="picks">{picks}</TabsContent></Tabs>;
}
