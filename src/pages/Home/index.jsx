import React from 'react';
import './style.scss';
import FloorScheme from "../../components/FloorScheme";

// import catalogue images
import Roses from '/src/assets/media/catalogue/roses.jpg';
import Plants from '/src/assets/media/catalogue/plants.jpg';
import Green from '/src/assets/media/catalogue/green.jpg';
import Exotics from '/src/assets/media/catalogue/exotics.jpg';
import Dianthus from '/src/assets/media/catalogue/dianthus.jpg';
import Drugs from '/src/assets/media/catalogue/drugs.jpg';
import Chrysant from '/src/assets/media/catalogue/chrysant.jpg';
import Accessories from '/src/assets/media/catalogue/accessories.jpg';
import Package from '/src/assets/media/catalogue/packing.jpg';
import Boxes from '/src/assets/media/catalogue/boxes.jpg';
import Decor from '/src/assets/media/catalogue/dekor.jpg';
import Toys from '/src/assets/media/catalogue/iqruwki.jpg';
import Baskets from '/src/assets/media/catalogue/korzina.jpg';
import Plastic from '/src/assets/media/catalogue/plastic.jpg';
import Dried from '/src/assets/media/catalogue/dried.jpg';


export default function index() {

  return (
    <div className="main_container ">

      <div className="catalogue-wrapper">

        <h1 className='catalogue_text'>Каталог товаров</h1>

        <div className="catalogue">

          <div className="catalogue_items glass">

            <img src={Roses}
              alt="roses" />

            <p>Розы</p>
          </div>

          <div className="catalogue_items glass">

            <img src={Exotics}
              alt="exotics" />

            <p>Экзотика</p>
          </div>

          <div className="catalogue_items glass">

            <img src={Chrysant}
              alt="chrysant" />

            <p>Хризантема</p>
          </div>

          <div className="catalogue_items glass">

            <img src={Dianthus}
              alt="dianthus" />

            <p>Гвоздика</p>
          </div>

          <div className="catalogue_items glass">


            <img src={Green}
              alt="greenery" />

            <p>Зелень</p>
          </div>

          <div className="catalogue_items glass">

            <img src={Plants}
              alt="plants" />

            <p>Горшечные</p>
          </div>

        </div>

        <h1 className='catalogue_text'>Сопутствующие</h1>

        <div className="catalogue">

          <div className="catalogue_items glass">

            <img src={Drugs}
              alt="drugs" />

            <p>Удобрения</p>
          </div>

          <div className="catalogue_items glass">

            <img src={Dried}
              alt="dried" />

            <p>Сухоцветы</p>
          </div>

          <div className="catalogue_items glass">

            <img src={Accessories}
              alt="accessories" />

            <p>Инструменты</p>
          </div>

          <div className="catalogue_items glass">

            <img src={Package}
              alt="package" />

            <p>Упаковка</p>
          </div>

          <div className="catalogue_items glass">

            <img src={Boxes}
              alt="boxes" />

            <p>Ящики</p>
          </div>

          <div className="catalogue_items glass">

            <img src={Baskets}
              alt="baskets" />

            <p>Корзины</p>
          </div>

          <div className="catalogue_items glass">

            <img src={Plastic}
              alt="pots" />

            <p>Горшки</p>
          </div>

          <div className="catalogue_items glass">

            <img src={Decor}
              alt="decor" />

            <p>Декор</p>
          </div>

          <div className="catalogue_items glass">

            <img src={Toys}
              alt="toys" />

            <p>Игрушки</p>
          </div>

        </div>
      </div>

      <FloorScheme />

    </div>
  )
}
