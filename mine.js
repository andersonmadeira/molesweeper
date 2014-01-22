Game = {
  // quantidade de linhas e colunas
  lins: 7,
  cols: 20,
  mine_count: 5,
  // quantidade de pontos não descobertos ainda
  hidden_count: 25,
  all_elem: [],
  revealed_elem: [],
  mines_elem: [],
  // se o jogo chegou ao fim
  over: false,
  // gui options
  gui: null,
  control: null,
  fade_speed: 300,
  // methods
  init: function (lins, cols) {
    /*Game.gui = new dat.GUI();
    Game.gui.add(Game, 'reset').name('New Game');
    Game.control = Game.gui.add(Game, 'mine_count');
    Game.control.name('Mines').min(1).max(Game.lins * Game.cols - 1).step(1);
    Game.gui.add(Game, 'lins').min(3).max(20).step(1).name('Lines').onChange(function(value) {
      Game.control.max(Game.lins * Game.cols - 1);
    });
    Game.gui.add(Game, 'cols').min(3).max(20).step(1).name('Columns').onChange(function(value) {
      // Game.controllers.mines.max(Game.lins * Game.cols - 1);
    });
    Game.gui.add(Game, 'fade_speed').min(100).max(1000).step(1).name('Fade Duration');*/
    Game.reset();
  },
  reset: function () {
    Game.over = false;
    //Game.mine_count = 3 || Math.sqrt(Game.lins * Game.cols);
    Game.hidden_count = Game.lins * Game.cols;
    Game.all_elem = [];
    $('.game_board').remove(); // remove a tabela do html
    if ($('#face_status').hasClass('game_face_lost'))
      $('#face_status').removeClass('game_face_lost');
    else if($('#face_status').hasClass('game_face_won'))
      $('#face_status').removeClass('game_face_won');
    $('#face_status').addClass('game_face_good');
    var tab = $('<table class="game_board"></table>'),
        lin = null,
        col = null,
        elem = null, 
        font_size = 24,
        elem_width = 30,
        elem_height = 30;
    // BEGIN - gera os elementos DOM
    // obtem os tamanhos ajustados
    
    // desabilita o menu de contexto quando clique com o botão direito
    tab.bind('contextmenu', function(e) {
      e.preventDefault();
    });
    for(var i = 0; i < Game.lins; i++) {
      lin = $('<tr></tr>');
      tab.append(lin);
      for(var j = 0; j < Game.cols; j++) {
        col = $('<td class="game_disabled"></td>');
        elem = $('<div class="game_enabled" id="p'+i+'-'+j+'"><span class="game_label"></span></div>');
        // setta os dimensões
        elem.width(elem_width);
        elem.height(elem_height);
        elem.find('span').css('font-size', font_size);
        elem.data('lin', i);
        elem.data('col', j);
        elem.data('type', 0);
        elem.data('flag', 0);
        // 0 == false, 1 == true
        elem.data('revealed', 0);
        col.append(elem);
        // [[--
        // função disparada sempre que o usuário solta o botão do mouse. Aqui é onde grande parte da diversão acontece. (:
        elem.on('mouseup', Game._on_mouse_up);
        lin.append(col);
        Game.all_elem.push(elem);
      }
    }
    $('#game_board').append(tab);
    $('#gwrapper').width(tab.width());
    $('#gwrapper').height(tab.height());
    $('#total_mines').html(Game.mine_count);
    // END - of generating the DOM elements
    // [DONE] MINAS - BEGIN [
    var elems_left = Game.all_elem.slice(),
        mines_left_count = Game.mine_count,
        chosen = 0, 
        length = Game.all_elem.length,
        mines_around = 0,
        i = 0,
        j = 0;
    while(length > 0) {
      // pega um aleatório dos disponíveis
      chosen = (Math.random() * length) | 0;
      // se ainda tiver minas pra colocar, coloca
      if (mines_left_count > 0) {
        console.log('Put a mine at: '+ elems_left[chosen].data('lin') + '-' + elems_left[chosen].data('col'));
        // marca esse como mina, com -1
        elems_left[chosen].data('type', -1);
        // coloca na lista de minas.
        Game.mines_elem.push(elems_left[chosen]);
        // tira o escolhido da lista de possíveis
        elems_left.splice(chosen, 1);
        mines_left_count--;
      // as minas já vão estar posicionadas, então 
      // agora é só ir colocando quantas minas tem ao redor de cada quadrado
      } else {
        mines_around = 0;
        // pega a linha e columa desse escolhido
        i = elems_left[chosen].data('lin'),
        j = elems_left[chosen].data('col');
        // checa por minas em todos os vizinhos
        for(var i2 = i-1; i2 <= i+1; i2++) {
          for(var j2 = j-1; j2 <= j+1; j2++) {
            // se for inválido e se tiver uma mina nesse vizinho, então conta a mina
            if (i2 >= 0 && i2 <=10 && Game.lins-1 && j2 >= 0 && j2 <= Game.cols-1 && !(i2 == i && j == j2) 
                && $('#p'+i2+'-'+j2).data('type') == -1) {
              mines_around++;
            }
          }
        }
        // coloca no elemento quantas minas ele tem e tira ele da lista de possíveis.
        elems_left[chosen].data('type', mines_around);
        elems_left.splice(chosen, 1);
      }
      length--;
    }
    // ] END 
  },
  solved: function () {
    return false;
  },
  // PRIVATE STUFF
  // private functions
  _on_mouse_up: function (event) {
    //console.log('Square '+$(this).data('lin')+'-'+$(this).data('col')+' Game.clicked!');
    //console.log('Blocks left:',Game.hidden_count);
    //console.log('Total Mines:',Game.mine_count);
    Game.clicked = $(this);
    var clicked_type = 0;
    // log data
    console.log(Game.clicked.data('lin'), Game.clicked.data('col'), ' clicked!');
    // SE ele clicou nela, mas se o jogo terminou ou ela tá desabilitada, então não faz nada.
    if (Game.over || Game.clicked.data('revealed') == 1) {
      console.log('Nothing to do!');
      return;
    }
    // se foi o botão esquerdo do mouse e não foi clicado numa flag
    if (event.which == 1 && Game.clicked.data('flag') == 0) {
      // [[--
      // anima fadeout e chama a callback quando terminar o efeito. Isso faz o efeito de fade depois de cada clique
      // MELHORAR:
      // + Pelo que testei para que quando o número da linha ou da coluna tem mais de um dígito, ou seja
      // Game.cols > 9 || Game.lins > 9, essa função se comporta de maneira anormal. Ver issue1.png.
      if (Game.clicked.data('type') > 0)
        Game.clicked.find('span').html(Game.clicked.data('type'));
      Game.clicked.animate({opacity: 0.1}, Game.fade_speed, Game._on_dot_clicked);
    // se foi o botão direito do mouse e se não foi em cima de uma revelada ou de uma flag
    } else if (event.which == 3 && Game.clicked.data('revealed') == 0) { 
      var number = 0;
      Game.clicked.find('span').toggleClass('game_flag');
      if (Game.clicked.data('flag') == 1) {
        number = parseInt($('#flag_count').html()) - 1;
        Game.clicked.data('flag', 0);
        if (number <= Game.mine_count && $('#gflag_label').hasClass('gwrong_flag_count'))
          $('#gflag_label').removeClass('gwrong_flag_count');
      } else {
        number = parseInt($('#flag_count').html()) + 1;
        Game.clicked.data('flag', 1);
        if (number > Game.mine_count)
          $('#gflag_label').addClass('gwrong_flag_count');
      }
      $('#flag_count').html(number);
    }
    // --]]
  },
  _on_dot_clicked: function () {
    Game.clicked.addClass('game_disabled');
    clicked_type = Game.clicked.data('type');
    // SE clicou numa mina mostra ela primeiro, depois as outras.
    if (clicked_type == -1) {
      console.log('BOOOM!!!');
      // marca como o fim do jogo.
      Game.over = true;
      // primeiro mostra a mina que o cara clicou e explodiu
      Game.clicked.find('span').addClass('game_bmine');
      // salva a posição da que eu já mostrei.
      var lin2 = Game.clicked.data('lin'),
          col2 = Game.clicked.data('col');
      // --
      ///var k = Game.mines_elem.length-1;
      // para todas as minas que tão guardadas na lista Game.mines_elem mostrar elas e remover.
      for(var k = Game.mines_elem.length-1; k >= 0; k--) {
        // se não for a mina que disparou o click, ou seja, a mina que ele clicou primeiro então mostra.
        if (Game.mines_elem[k].data('lin') != lin2 || Game.mines_elem[k].data('col') != col2) {
          console.log('Showed mine at:',Game.mines_elem[k].attr('id'));
          // se era uma flag, tira ela
          if (Game.mines_elem[k].data('flag') == 1) {
            // remove a classe css de flag
            Game.mines_elem[k].find('span').removeClass('game_flag');
            // vamos diminuir agora o contador de flags
            var number = 0;
            number = parseInt($('#flag_count').html()) - 1;
            $('#flag_count').html(number);
            if (number <= Game.mine_count && $('#gflag_label').hasClass('gwrong_flag_count'))
              $('#gflag_label').removeClass('gwrong_flag_count');

          }
          Game.mines_elem[k].find('span').addClass('game_mine');
          // não precisa marcar a mina como já revelada pro usuário não clicar nela denovo porque 
          // a var Game.over é settada como true, então não vai acontecer mais nada.
        }
        // -- não precisa revelar, já morreu, não vai fazer mais nada.
        ///Game.mines_elem[k].data('revealed', 1);
        Game.mines_elem.splice(k, 1);
      }
      $('#face_status').removeClass('game_face_good');
      $('#face_status').addClass('game_face_lost');
    // SE clicou num espaço em branço
    // vai ser assim, no sentido horário cada um vai enfileirando seus vizinhos, para serem verificados
    // se se ele tiver alguma mina ao seu redor, i.e. data('type') > 0, então não coloca vizinhos
    // depois remove da fila o que foi verificado
    /// [[-- @todo AJEITAR ESSE ELSE AQUI PRA FAZER O BORDER_FIND QUANDO CLICAR NO BRANCO
    } else {
      // pending é uma fila que vai conter os pontos restantes que precisam ter seus vizinhos verificados
      var pending = [Game.clicked],
          // quantos elementos tem pra processar, atalho pra pending.length, pra ganho de desempenho.
          k = 1,
          // vai assumir cada vizinho do ponto que estivermos verificando.
          tmp = null,
          // tipo de cada vizinho, se é mina, etc...
          this_type = 0,
          this_elem = null,
          // @alpha-TESTE1: somente um teste com o efeito de mostrar os vizinhos
          timer_seed = 100;
      // marca esse como revelado
      pending[0].data('revealed', 1);
      // O algorítmo funciona assim, 
      // OBS.: Ao final de cada iteração ele vai tirar o primeiro elemento da fila e diminuir a quantidade de restantes
      for(var k = 1; k > 0; k--, timer_seed+=5) {
        i = pending[0].data('lin');
        j = pending[0].data('col');
        // se era uma flag, tira ela
        if (pending[0].data('flag') == 1) {
          pending[0].data('flag', 0);
          pending[0].find('span').removeClass('game_flag');
        }
        // marca esse que estou vendo como já revelado e revela ele para o jogador
        // line added
        this_elem = pending[0];
        this_type = pending[0].data('type');
        pending[0].animate({opacity: 0.1}, Game.fade_speed, Game._on_reveal_neighbors);
        // just b4 test
        //console.log('this_type',this_type);
        // só verifica os vizinhos se for um espaço em branco
        if (this_type == 0) { 
          // enfileira vizinhospassa para o fim da iteração.
          for(var i2 = i-1; i2 <= i+1; i2++) {
            for(var j2 = j-1; j2 <= j+1; j2++) {
              // se for válida e ainda não tiver sido revelada, revela e depois enfileira
              if (i2 >= 0 && i2 <= Game.lins-1 && j2 >= 0 && j2 <= Game.cols-1) {
                str = '#p'+i2+'-'+j2;
                //console.log('+++:'+str);
                //console.log('->Checking neighbors of',str,':');
                tmp = $(str);
                if (tmp.data('revealed') == 0) {
                  // [[-- BEGIN revela!
                  //alert('Unrevealed neighbor of '+pending[0].attr('id')+' found: '+tmp.attr('id'));
                  
                  tmp.data('revealed', 1);
                  pending.push(tmp);
                  k++;
                }
              }
            }
          }
        }
        // tira esse que eu verifiquei
        pending.splice(0, 1);
      }

    } // --]] @todo fix this function
    Game.clicked.css({'opacity': 1});
  },
  _on_reveal_neighbors: function () {
    $(this).addClass('game_disabled');
    // quando terminar o efeito, olha se é um 'nada', ou seja, se não tem nenhuma mina ao redor desse
    // esse vai ser o comportamento do jogo, quando o jogador clicar em 'nada' tem que mostrar todos os
    // 'nadas' com as b22ordas sendo pontos com alguma mina ao redor. Melhor para entender é vendo... :/
    this_type = $(this).data('type');
    if (this_type == -1) {
      $(this).find('span').addClass('game_mine');
    }
    else if (this_type != 0) {
      $(this).find('span').html(this_type);
    }
    $(this).css({'opacity': 1});
    // se o jogo acabou, ou seja, se só tem minas pra ser descoberta então jogador ganhou
    Game.hidden_count--;
   //console.log('Testing',Game.hidden_count,'==',Game.mine_count);
    if (Game.hidden_count == Game.mine_count) {
      console.log('Game won with:', Game.hidden_count, 'remaining blocks!');
      var lin2 = Game.clicked.data('lin'),
          col2 = Game.clicked.data('col');
      var k = Game.mines_elem.length-1;
      // para todas as minas que tão guardadas na lista Game.mines_elem mostrar elas e remover.
      for(var k = Game.mines_elem.length-1; k >= 0; k--) {
        // se não for a mina que disparou o click, ou seja, a mina que ele clicou primeiro então mostra.
        if (Game.mines_elem[k].data('lin') != lin2 || Game.mines_elem[k].data('col') != col2) {
          //console.log('Showed mine at:',Game.mines_elem[k].attr('id'));
          // se era uma flag, tira ela
          if (Game.mines_elem[k].data('flag') == 1) {
            Game.mines_elem[k].data('flag', 0);
            Game.mines_elem[k].find('span').removeClass('game_flag');
          }
          Game.mines_elem[k].find('span').addClass('game_mine');
          // não precisa marcar a mina como já revelada pro usuário não clicar nela denovo porque 
          // a var Game.over é settada como true, então não vai acontecer mais nada.
        }
        Game.mines_elem[k].data('revealed', 1);
        Game.mines_elem.splice(k, 1);
      }
      Game.over = true;
      $('#face_status').removeClass('game_face_good');
      $('#face_status').addClass('game_face_won');
    }
  }
};

$(document).ready(function() {
  // generate n random numbers between 0 and 9
  Game.init();
});