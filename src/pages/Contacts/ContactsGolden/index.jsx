import ContactCard from '../../../components/ContactCard';


export default function ContactsGolden() {
  return (
    <section className="company-section">

      <div className="contacts-grid">

        <ContactCard
          title="Главный офис"
          phones={[
            { label: '8 (495) 781 88 88', number: '84957818888' }
          ]}
        />

        <ContactCard
          title="Хризантема и зелень"
          phones={[
            { label: '8 (925) 166 52 04', number: '89251665204' }
          ]}
        />

        <ContactCard
          title="Комнатные растения"
          phones={[
            {
              label: '8 (926) 635 51 81',
              number: '89266355181',
              telegram: 'https://t.me/+79266355181'
            }
          ]}
        />

        <ContactCard
          title="Экзотические цветы"
          phones={[
            {
              label: '8 (964) 511 71 13',
              number: '89645117113',
              telegram: 'https://t.me/+79645117113'
            },
            {
              label: '8 (903) 286 81 88',
              number: '89092868188',
              telegram: 'https://t.me/+79092868188'
            }
          ]}
        />

        <ContactCard
          title="Цветы из Китая"
          phones={[
            {
              label: '8 (964) 781 88 87',
              number: '89647818887',
              telegram: 'https://t.me/+79647818887'
            }
          ]}
        />

        <ContactCard
          title="Сухоцветы"
          phones={[
            {
              label: '8 (999) 838 28 89',
              number: '89998382889',
              telegram: 'https://t.me/+79998382889'
            }
          ]}
        />

        <ContactCard
          title="Розы из Кении"
          phones={[
            {
              label: '8 (925) 453 39 69',
              number: '89254533969',
              telegram: 'https://t.me/+79254533969'
            },
            {
              label: '8 (965) 239 85 88',
              number: '89652398588',
              telegram: 'https://t.me/+79652398588'
            }
          ]}
        />

        <ContactCard
          title="Розы из Эквадора"
          phones={[
            {
              label: '8 (967) 292 11 55',
              number: '89672921155',
              telegram: 'https://t.me/+79672921155'
            },
            {
              label: '8 (909) 698 81 88',
              number: '89096988188',
              telegram: 'https://t.me/+79096988188'
            }
          ]}
        />

        <ContactCard
          title="Розы на воде"
          phones={[
            {
              label: '8 (906) 028 02 48',
              number: '89060280248',
              telegram: 'https://t.me/+79060280248'
            }
          ]}
        />

        <ContactCard
          title="Упаковка"
          phones={[
            {
              label: '8 (965) 411 88 85',
              number: '89654118885'
            }
          ]}
        />

        <ContactCard
          title="Сбор заказов"
          phones={[
            {
              label: '8 (963) 781 88 89',
              number: '89637818889',
              telegram: 'https://t.me/+79637818889'
            }
          ]}
        />

      </div>
    </section>
  );
}