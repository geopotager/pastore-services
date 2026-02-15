import { ServiceDef } from './types';
import { Hammer, Trees, Monitor, FileText, Wrench, PaintRoller, Droplets } from 'lucide-react';

export const SERVICES: ServiceDef[] = [
  {
    id: 'bricolage',
    title: 'Bricolage',
    icon: 'Hammer',
    color: 'bg-neo-yellow',
    description: 'Réparations, fixations, et petits travaux divers.',
    longDescription: 'Notre service de bricolage couvre tous les petits travaux du quotidien que vous n\'avez pas le temps ou l\'outillage pour réaliser. Pose d\'étagères, changement de luminaires, réparation de fuites mineures, rebouchage de trous, installation de tringles à rideaux. Nos bricoleurs sont polyvalents, équipés et soigneux.'
  },
  {
    id: 'peinture',
    title: 'Peinture',
    icon: 'PaintRoller',
    color: 'bg-orange-400',
    description: 'Peinture intérieure et retouches.',
    longDescription: 'Redonnez vie à vos murs ! Nous réalisons vos travaux de peinture intérieure (murs, plafonds, portes) et petites retouches. Nous assurons la protection des sols, la préparation des supports (enduit, ponçage léger) et des finitions soignées pour un résultat impeccable.'
  },
  {
    id: 'montage',
    title: 'Montage Meuble',
    icon: 'Wrench',
    color: 'bg-neo-pink',
    description: 'Montage et démontage de mobilier (IKEA, etc).',
    longDescription: 'Ne perdez plus votre week-end à déchiffrer des notices ! Nous assemblons vos meubles en kit (IKEA, Conforama, etc.) rapidement et solidement. Nous assurons également le démontage si vous déménagez ou changez de décoration. Le forfait comprend l\'assemblage, la fixation au mur si nécessaire et le nettoyage de la zone de travail.'
  },
  {
    id: 'jardin',
    title: 'Jardin & Création',
    icon: 'Trees',
    color: 'bg-neo-green',
    description: 'Entretien, tonte, taille et aménagement.',
    longDescription: 'Profitez de votre jardin sans la corvée. Nous proposons la tonte de pelouse, la taille de haies et d\'arbustes, le désherbage manuel et le ramassage de feuilles. Nous pouvons également réaliser de petites créations paysagères : plantation de massifs, création de potager, ou pose de bordures pour embellir votre extérieur.'
  },
  {
    id: 'karcher',
    title: 'Nettoyage Karcher',
    icon: 'Droplets',
    color: 'bg-cyan-500',
    description: 'Nettoyage haute pression terrasses et extérieurs.',
    longDescription: 'Décrassage en profondeur de vos extérieurs. Nous utilisons des nettoyeurs haute pression professionnels pour remettre à neuf vos terrasses (bois, carrelage, pierre), allées de jardin, murets et façades accessibles, en éliminant mousses, lichens et saletés incrustées par le temps.'
  },
  {
    id: 'informatique',
    title: 'Assistance IT',
    icon: 'Monitor',
    color: 'bg-neo-blue',
    description: 'Dépannage PC/Mac, installation, wifi.',
    longDescription: 'Une imprimante capricieuse ? Un ordinateur lent ? Un réseau Wifi qui ne couvre pas toute la maison ? Nos techniciens interviennent à domicile pour diagnostiquer et résoudre vos problèmes informatiques. Nous proposons aussi des formations initiation pour les seniors (usage tablette, smartphone, email) et l\'installation de box internet.'
  },
  {
    id: 'admin',
    title: 'Aide Admin',
    icon: 'FileText',
    color: 'bg-neo-purple',
    description: 'Classement, courriers, démarches en ligne.',
    longDescription: 'Laissez-nous gérer la paperasse. Nous vous assistons dans le tri et le classement de vos documents, la rédaction de courriers officiels, et surtout l\'accompagnement pour vos démarches administratives en ligne (impôts, allocations, inscriptions). Un service confidentiel et bienveillant pour retrouver l\'esprit tranquille.'
  },
];

export const MOCK_SLOTS = [
  '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'
];