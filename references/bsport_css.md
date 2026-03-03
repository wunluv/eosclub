#bsport css for widgets

.bs-search__input:focus,
.bs-search__input__icon:focus {
  outline: none;
}

.bs-search__input__icon:hover,
.bs-search__input__icon:focus,
.bs-search__results__container__list:focus {
  background-color: rgba(10, 109, 242, 0.04);
}

.bs-search__input__icon {
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  color: #687586;
  cursor: pointer;
  border-radius: 999px;
}

.bs-search__container {
  display: flex;
  background: #fff;
  border: solid 2px #F1F3F4;
  border-radius: calc(4px * 8);
  width: fit-content;
  min-width: 400px;
  position: relative;
}

.bs-search__input__container {
  height: 40px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  flex: 1;
}

.bs-search__input {
  font-family: "Roboto", "Helvetica", "Arial", sans-serif;
  /* to disable autofocus on safari, font-size needs to be 16px minimum  */
  font-size: 16px;
  text-size-adjust: 100%;
  -webkit-text-size-adjust: 100%;
  -moz-text-size-adjust: 100%;
  color: #2D3748;
  border: none;
  padding: 0 12px;
  height: 40px;
  flex: 1;
  border-radius: 34px;
}

.bs-search__input__icon {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bs-search__results__container {
  display: flex;
  position: absolute;
  background: #fff;
  width: 100%;
  top: calc(40px + 12px);
  box-shadow: 0px 1px 4px rgba(0, 0, 0, 0.1);
  border-radius: 16px;
  z-index: 1;
  min-height: calc(8px * 8);
  color: #2D3748;
}

.bs-search__results__container__list__placeholder__container {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
}

.bs-search__results__container__list__placeholder {
  font-family: "Roboto", "Helvetica", "Arial", sans-serif;
  /* to disable autofocus on safari, font-size needs to be 16px minimum 
  we're trying text-size adjust instead of hardcoding 16px for now
  */
  /* font-size: 16px; */
  text-size-adjust: 100%;
  -webkit-text-size-adjust: 100%;
  -moz-text-size-adjust: 100%;
  margin: 0;
  text-align: center;
}

@container (width < 750px) {
  .bs-search__container {
    min-width: 0;
    width: 100%;
  }
}
