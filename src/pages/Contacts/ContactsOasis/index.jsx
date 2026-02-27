import ContactCard from '../../../components/ContactCard';


export default function ContactsOasis() {
  return (
    <section className="company-section">

      <div className="contacts-grid">

        <ContactCard
          title="Главный офис"
          phones={[
            { label: '8 (495) 665 88 88', number: '84956658888' },
            {
              label: '8 (996) 173 88 88',
              number: '89961738888',
              telegram: 'https://t.me/+79645117113'
            }
          ]}
        />

        <ContactCard
          title="Хризантема и зелень"
          phones={[
            {
              label: '8 (966) 013 66 67',
              number: '89660136667',
              telegram: 'https://t.me/+79660136667'
            }
          ]}
        />

        <ContactCard
          title="Комнатные растения"
          phones={[
            {
              label: '8 (966) 013 22 24',
              number: '89660132224',
              telegram: 'https://t.me/+79660132224'
            }
          ]}
        />

        <ContactCard
          title="Экзотические цветы"
          phones={[
            {
              label: '8 (966) 013 52 22',
              number: '89660135222',
              telegram: 'https://t.me/+79660135222'
            }
          ]}
        />

        <ContactCard
          title="Цветы из Китая - Сухоцветы"
          phones={[
            {
              label: '8 (966) 013 24 44',
              number: '89660132444',
              telegram: 'https://t.me/+79660132444'
            }
          ]}
        />

        <ContactCard
          title="Розы из Эквадора"
          phones={[
            {
              label: '8 (966) 013 53 33',
              number: '89660135333',
              telegram: 'https://t.me/+79660135333'
            }
          ]}
        />

        <ContactCard
          title="Розы на воде"
          phones={[
            {
              label: '8 (925) 294 80 20',
              number: '89252948020',
              telegram: 'https://t.me/+79252948020'
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

      </div>
    </section>
  );
}