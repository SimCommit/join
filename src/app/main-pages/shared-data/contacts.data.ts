import { Contact } from "./contact.interface";

/**
 * Default contact dataset used as local dummy data.
 * Used to prefill Firestore when no user contacts exist.
 *
 * @constant
 * @type {Contact[]}
 */
export const Contacts: Contact[] = 
 [
    {
      name: 'Alex Berger',
      email: 'berger@t-online.de',
      phone: '+49 172 98765432',
    },
    {
      name: 'Anna Schreiner',
      email: 'anna.schreiner@gmail.com',
      phone: '+49 152 99008877',
    },
    {
      name: 'Donna Tutel',
      email: 'tutel@gmail.com',
      phone: '+49 163 22113161',
    },
    {
      name: 'Hamato Yoshi',
      email: 'hamato@protonmail.com',
      phone: '+49 151 77889900',
    },
    {
      name: 'Leon Chevalier',
      email: 'leon@protonmail.com',
      phone: '+49 152 99008877',
    },
    {
      name: 'Matteo Müller',
      email: 'müller@gmail.com',
      phone: '+49 1234 849494',
    },
    {
      name: 'Mike Palmieri',
      email: 'mike-p@aol.com',
      phone: '',
    },
    {
      name: 'Otto Saki',
      email: 'picador@gmail.com',
      phone: '+49 160 99887766',
    },
    {
      name: 'Raphaela Sai',
      email: 'sai@freenet.de',
      phone: '+49 160 99887766',
    },
    {
      name: 'Simon Fuchs',
      email: 'contact@simon-fuchs.net',
      phone: '+49 8092 854450',
    },
  ];
