window.MapBBCode.include({strings: {
    close: 'Закрыть', // close feature editing popup
    remove: 'Удалить', // delete feature from popup
    apply: 'Применить', // button on an editing map to apply changes
    cancel: 'Отменить', // button on an editing map to discard changes
    title: 'Надпись', // prompt for marker title text

    // button titles
    zoomInTitle: 'Приблизить',
    zoomOutTitle: 'Отдалить',
    applyTitle: 'Сохранить изменения',
    cancelTitle: 'Отменить изменения',
    fullScreenTitle: 'Растянуть или сжать панель карты',
    helpTitle: 'Открыть окно справки',
    outerTitle: 'Открыть внешний сайт с картой этого места',
    sharedCodeError: 'Внешний сайт выдал ошибку вместо карты<br><br><a href="{url}" target="mapbbcode_outer">Открыть карту в новом окне</a>',

    // Leaflet.draw
    polylineTitle: 'Нарисовать ломаную',
    polygonTitle: 'Нарисовать многоугольник',
    markerTitle: 'Добавить маркер',
    drawCancelTitle: 'Отменить рисование',
    markerTooltip: 'Нажмите на карту для установки маркера',
    polylineStartTooltip: 'Нажмите, чтобы начать рисование линии',
    polylineContinueTooltip: 'Нажмите для продолжения линии',
    polylineEndTooltip: 'Для завершения линии нажмите на её последнюю точку',
    polygonStartTooltip: 'Нажмите, чтобы начать рисование контура',
    polygonContinueTooltip: 'Нажмите для продолжения контура',
    polygonEndTooltip: 'Для замыкания контура нажмите на его начальную точку',

    // help: array of html paragraphs, simply joined together. First line is <h1>, start with '#' for <h2>.
    helpContents: [
        'Редактор Map BBCode',
        'Вы открыли это окно из редактора карты. Он появляется по нажатию кнопки «Map». Когда в форме редактирования сообщения курсор стоит внутри кода [map], вы будете редактировать этот код, иначе создадите новый код карты и после нажатия «Применить» получите его в позиции курсора.',
        '# BBCode',
        'Код карты находится внутри тегов <tt>[map]...[/map]</tt>. Открывающий тег может содержать значение масштаба с опциональными координатами центра карты в формате широта,долгота: <tt>[map=10]</tt> или <tt>[map=15,60.1,30.05]</tt>. Десятичный разделитель — всегда точка.',
        'Внутри тега — разделённый точками с запятой список объектов: маркеров и ломаных. Они различаются только количеством координат (разделённых пробелами): у маркеров одна, у ломаных — много. У многоугольников первая координата равна последней. После списка координат можно указать надпись в скобках: <tt>12.3,-5.1(Popup)</tt> (в редакторе — только для маркеров). Надпись — это HTML, и может содержать любые символы, только «(» нужно заменять на «\\(», и не все теги разрешены.',
        'Ломаные и многоугольники можно задать цвет в <i>параметрах</i>: части надписи, после которой идёт символ «|». Например, <tt>12.3,-5.1 12.5,-5 12,0 (red|)</tt> определяет красную линию из двух отрезков.',
        '# Просмотр карты',
        'Кнопки с плюсом и минусом изменяют масштаб. Остальные кнопки могут быть отключены на вашем форуме. Кнопка с четырьмя стрелочками разворачивает панель карты во всю ширину окна. Если у карты много слоёв, их переключатель находится справа вверху. Кнопка с загнутой стрелкой, если есть, откроет внешний картографический сайт (обычно — www.openstreetmap.org) в позиции, отображаемой на карте.',
        'Для сдвига карты перетаскивайте её, если нажать на кнопки масштаба с зажатым Shift, масштаб будет изменяться быстрее. Если с зажатым Shift растянуть прямоугольник на карте, он быстро приблизится. Масштабирование колесом мыши отключено в просмотре, чтобы не мешать прокрутке страницы, но работает в редакторе.',
        '# Кнопки редактора',
        '«Применить» сохранит нарисованные объекты (или местоположение карты, если их нет) в сообщении, а «Отменить» просто закроет панель редактирования карты. Что делает кнопка «?», вы уже заметили. Две кнопки под кнопками масштабирования добавляют объекты на карту.',
        'Чтобы нарисовать ломаную, нажмите кнопку с диагональным отрезком и кликните куда-нибудь в карту. Затем кликайте снова и снова, добавляя отрезки в ломаную. Если где-то промахнётесь, не беда: потом поправите. Нажмите на последнюю добавленную точку, чтобы завершить рисование. После этого можно двигать точки и добавлять промежуточные узлы, тягая маленькие квадратики и круги. Кликнув на квадратик, вы удалите узел. Чтобы удалить ломаную (или маркер), нажмите на него, и в появившемся окне выберите «Удалить».',
        'Маркер добавить проще: нажмите кнопку с маркером, нажмите на карту. Во всплывшем окне можно ввести надпись: если она длиной 1-2 символа, надпись появится прямо на карте, иначе для её отображения придётся щёлкнуть в маркер. В надписи можно использовать переводы строк (правда, не в редакторе карты) и адреса URL.',
        '# Модуль',
        'Редактор Map BBCode — проект с открытым исходным кодом. Его можно найти на <a href="https://github.com/MapBBCode/mapbbcode">гитхабе</a>. Там же вы найдёте модули для некоторых популярных форумных движков. Все пожелания и сообщения об ошибках оставляйте тоже на гитхабе.'
    ]
}});
