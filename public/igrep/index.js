$(function() {

  // Define genomes
  var genomes = [{
    taxid: 13616,
    name: 'Monodelphis domestica (opossum)',
    ncbiBuild: 2,
    version: 2,
    releaseDate: '1 July 2011',
    nucleotides: 3502390117,
    files: [{
      file: 'mdm_ref_MonDom5_chr1.fa.gz',
      header: '>gi|126361933|ref|NC_008801.1| Monodelphis domestica chromosome 1, MonDom5, whole genome shotgun sequence',
      nucleotides: 748055161
    }, {
      file: 'mdm_ref_MonDom5_chr2.fa.gz',
      header: '>gi|126362075|ref|NC_008802.1| Monodelphis domestica chromosome 2, MonDom5, whole genome shotgun sequence',
      nucleotides: 541556283
    }, {
      file: 'mdm_ref_MonDom5_chr3.fa.gz',
      header: '>gi|126362809|ref|NC_008803.1| Monodelphis domestica chromosome 3, MonDom5, whole genome shotgun sequence',
      nucleotides: 527952102
    }, {
      file: 'mdm_ref_MonDom5_chr4.fa.gz',
      header: '>gi|126362810|ref|NC_008804.1| Monodelphis domestica chromosome 4, MonDom5, whole genome shotgun sequence',
      nucleotides: 435153693
    }, {
      file: 'mdm_ref_MonDom5_chr5.fa.gz',
      header: '>gi|126362941|ref|NC_008805.1| Monodelphis domestica chromosome 5, MonDom5, whole genome shotgun sequence',
      nucleotides: 304825324
    }, {
      file: 'mdm_ref_MonDom5_chr6.fa.gz',
      header: '>gi|126362942|ref|NC_008806.1| Monodelphis domestica chromosome 6, MonDom5, whole genome shotgun sequence',
      nucleotides: 292091736
    }, {
      file: 'mdm_ref_MonDom5_chr7.fa.gz',
      header: '>gi|126362943|ref|NC_008807.1| Monodelphis domestica chromosome 7, MonDom5, whole genome shotgun sequence',
      nucleotides: 260857928
    }, {
      file: 'mdm_ref_MonDom5_chr8.fa.gz',
      header: '>gi|126362944|ref|NC_008808.1| Monodelphis domestica chromosome 8, MonDom5, whole genome shotgun sequence',
      nucleotides: 312544902
    }, {
      file: 'mdm_ref_MonDom5_chrX.fa.gz',
      header: '>gi|126362945|ref|NC_008809.1| Monodelphis domestica chromosome X, MonDom5, whole genome shotgun sequence',
      nucleotides: 79335909
    }, {
      file: 'mdm_ref_MonDom5_chrMT.fa.gz',
      header: '>gi|52547305|ref|NC_006299.1| Monodelphis domestica mitochondrion, complete genome',
      nucleotides: 17079
    }]
  }, {
    taxid: 9598,
    name: 'Pan troglodytes (chimpanzee)',
    ncbiBuild: 3,
    version: 1,
    releaseDate: '14 June 2011',
    nucleotides: 3160370125,
    files: [{
      file: 'ptr_ref_Pan_troglodytes-2.1.4_chr1.fa.gz',
      header: '>gi|291061376|ref|NC_006468.3| Pan troglodytes chromosome 1, Pan_troglodytes-2.1.4',
      nucleotides: 228333871
    }, {
      file: 'ptr_ref_Pan_troglodytes-2.1.4_chr2A.fa.gz',
      header: '>gi|291061375|ref|NC_006469.3| Pan troglodytes chromosome 2A, Pan_troglodytes-2.1.4',
      nucleotides: 113622374
    }, {
      file: 'ptr_ref_Pan_troglodytes-2.1.4_chr2B.fa.gz',
      header: '>gi|291061374|ref|NC_006470.3| Pan troglodytes chromosome 2B, Pan_troglodytes-2.1.4',
      nucleotides: 247518478
    }, {
      file: 'ptr_ref_Pan_troglodytes-2.1.4_chr3.fa.gz',
      header: '>gi|291061373|ref|NC_006490.3| Pan troglodytes chromosome 3, Pan_troglodytes-2.1.4',
      nucleotides: 202329955
    }, {
      file: 'ptr_ref_Pan_troglodytes-2.1.4_chr4.fa.gz',
      header: '>gi|291061372|ref|NC_006471.3| Pan troglodytes chromosome 4, Pan_troglodytes-2.1.4',
      nucleotides: 193495092
    }, {
      file: 'ptr_ref_Pan_troglodytes-2.1.4_chr5.fa.gz',
      header: '>gi|291061371|ref|NC_006472.3| Pan troglodytes chromosome 5, Pan_troglodytes-2.1.4',
      nucleotides: 182651097
    }, {
      file: 'ptr_ref_Pan_troglodytes-2.1.4_chr6.fa.gz',
      header: '>gi|291061370|ref|NC_006473.3| Pan troglodytes chromosome 6, Pan_troglodytes-2.1.4',
      nucleotides: 172623881
    }, {
      file: 'ptr_ref_Pan_troglodytes-2.1.4_chr7.fa.gz',
      header: '>gi|319999821|ref|NC_006474.3| Pan troglodytes chromosome 7, Pan_troglodytes-2.1.4',
      nucleotides: 161824586
    }, {
      file: 'ptr_ref_Pan_troglodytes-2.1.4_chr8.fa.gz',
      header: '>gi|291061368|ref|NC_006475.3| Pan troglodytes chromosome 8, Pan_troglodytes-2.1.4',
      nucleotides: 143986469
    }, {
      file: 'ptr_ref_Pan_troglodytes-2.1.4_chr9.fa.gz',
      header: '>gi|291061367|ref|NC_006476.3| Pan troglodytes chromosome 9, Pan_troglodytes-2.1.4',
      nucleotides: 137840987
    }, {
      file: 'ptr_ref_Pan_troglodytes-2.1.4_chr10.fa.gz',
      header: '>gi|291061366|ref|NC_006477.3| Pan troglodytes chromosome 10, Pan_troglodytes-2.1.4',
      nucleotides: 133524379
    }, {
      file: 'ptr_ref_Pan_troglodytes-2.1.4_chr11.fa.gz',
      header: '>gi|291061365|ref|NC_006478.3| Pan troglodytes chromosome 11, Pan_troglodytes-2.1.4',
      nucleotides: 133121534
    }, {
      file: 'ptr_ref_Pan_troglodytes-2.1.4_chr12.fa.gz',
      header: '>gi|291061364|ref|NC_006479.3| Pan troglodytes chromosome 12, Pan_troglodytes-2.1.4',
      nucleotides: 134246214
    }, {
      file: 'ptr_ref_Pan_troglodytes-2.1.4_chr13.fa.gz',
      header: '>gi|291061363|ref|NC_006480.3| Pan troglodytes chromosome 13, Pan_troglodytes-2.1.4',
      nucleotides: 115123233
    }, {
      file: 'ptr_ref_Pan_troglodytes-2.1.4_chr14.fa.gz',
      header: '>gi|291061362|ref|NC_006481.3| Pan troglodytes chromosome 14, Pan_troglodytes-2.1.4',
      nucleotides: 106544938
    }, {
      file: 'ptr_ref_Pan_troglodytes-2.1.4_chr15.fa.gz',
      header: '>gi|291061361|ref|NC_006482.3| Pan troglodytes chromosome 15, Pan_troglodytes-2.1.4',
      nucleotides: 99548318
    }, {
      file: 'ptr_ref_Pan_troglodytes-2.1.4_chr16.fa.gz',
      header: '>gi|291061360|ref|NC_006483.3| Pan troglodytes chromosome 16, Pan_troglodytes-2.1.4',
      nucleotides: 89983829
    }, {
      file: 'ptr_ref_Pan_troglodytes-2.1.4_chr17.fa.gz',
      header: '>gi|291061359|ref|NC_006484.3| Pan troglodytes chromosome 17, Pan_troglodytes-2.1.4',
      nucleotides: 82630442
    }, {
      file: 'ptr_ref_Pan_troglodytes-2.1.4_chr18.fa.gz',
      header: '>gi|291061358|ref|NC_006485.3| Pan troglodytes chromosome 18, Pan_troglodytes-2.1.4',
      nucleotides: 76611499
    }, {
      file: 'ptr_ref_Pan_troglodytes-2.1.4_chr19.fa.gz',
      header: '>gi|291061357|ref|NC_006486.3| Pan troglodytes chromosome 19, Pan_troglodytes-2.1.4',
      nucleotides: 63644993
    }, {
      file: 'ptr_ref_Pan_troglodytes-2.1.4_chr20.fa.gz',
      header: '>gi|291061356|ref|NC_006487.3| Pan troglodytes chromosome 20, Pan_troglodytes-2.1.4',
      nucleotides: 61729293
    }, {
      file: 'ptr_ref_Pan_troglodytes-2.1.4_chr21.fa.gz',
      header: '>gi|114795212|ref|NC_006488.2| Pan troglodytes chromosome 21, Pan_troglodytes-2.1.4',
      nucleotides: 46489110
    }, {
      file: 'ptr_ref_Pan_troglodytes-2.1.4_chr22.fa.gz',
      header: '>gi|291061355|ref|NC_006489.3| Pan troglodytes chromosome 22, Pan_troglodytes-2.1.4',
      nucleotides: 49737984
    }, {
      file: 'ptr_ref_Pan_troglodytes-2.1.4_chrX.fa.gz',
      header: '>gi|291061354|ref|NC_006491.3| Pan troglodytes chromosome X, Pan_troglodytes-2.1.4',
      nucleotides: 156848144
    }, {
      file: 'ptr_ref_Pan_troglodytes-2.1.4_chrY.fa.gz',
      header: '>gi|327554947|ref|NC_006492.3| Pan troglodytes chromosome Y, Pan_troglodytes-2.1.4',
      nucleotides: 26342871
    }, {
      file: 'ptr_ref_Pan_troglodytes-2.1.4_chrMT.fa.gz',
      header: '>gi|5835121|ref|NC_001643.1| Pan troglodytes mitochondrion, complete genome',
      nucleotides: 16554
    }]
  }, {
    taxid: 9606,
    name: 'Homo sapiens (human)',
    ncbiBuild: 37,
    version: 3,
    releaseDate: '7 September 2011',
    nucleotides: 3095693981,
    files: [{
      file: 'hs_ref_GRCh37.p5_chr1.fa.gz',
      header: '>gi|224589800|ref|NC_000001.10| Homo sapiens chromosome 1, GRCh37.p5 Primary Assembly',
      nucleotides: 249250621
    }, {
      file: 'hs_ref_GRCh37.p5_chr2.fa.gz',
      header: '>gi|224589811|ref|NC_000002.11| Homo sapiens chromosome 2, GRCh37.p5 Primary Assembly',
      nucleotides: 243199373
    }, {
      file: 'hs_ref_GRCh37.p5_chr3.fa.gz',
      header: '>gi|224589815|ref|NC_000003.11| Homo sapiens chromosome 3, GRCh37.p5 Primary Assembly',
      nucleotides: 198022430
    }, {
      file: 'hs_ref_GRCh37.p5_chr4.fa.gz',
      header: '>gi|224589816|ref|NC_000004.11| Homo sapiens chromosome 4, GRCh37.p5 Primary Assembly',
      nucleotides: 191154276
    }, {
      file: 'hs_ref_GRCh37.p5_chr5.fa.gz',
      header: '>gi|224589817|ref|NC_000005.9| Homo sapiens chromosome 5, GRCh37.p5 Primary Assembly',
      nucleotides: 180915260
    }, {
      file: 'hs_ref_GRCh37.p5_chr6.fa.gz',
      header: '>gi|224589818|ref|NC_000006.11| Homo sapiens chromosome 6, GRCh37.p5 Primary Assembly',
      nucleotides: 171115067
    }, {
      file: 'hs_ref_GRCh37.p5_chr7.fa.gz',
      header: '>gi|224589819|ref|NC_000007.13| Homo sapiens chromosome 7, GRCh37.p5 Primary Assembly',
      nucleotides: 159138663
    }, {
      file: 'hs_ref_GRCh37.p5_chr8.fa.gz',
      header: '>gi|224589820|ref|NC_000008.10| Homo sapiens chromosome 8, GRCh37.p5 Primary Assembly',
      nucleotides: 146364022
    }, {
      file: 'hs_ref_GRCh37.p5_chr9.fa.gz',
      header: '>gi|224589821|ref|NC_000009.11| Homo sapiens chromosome 9, GRCh37.p5 Primary Assembly',
      nucleotides: 141213431
    }, {
      file: 'hs_ref_GRCh37.p5_chr10.fa.gz',
      header: '>gi|224589801|ref|NC_000010.10| Homo sapiens chromosome 10, GRCh37.p5 Primary Assembly',
      nucleotides: 135534747
    }, {
      file: 'hs_ref_GRCh37.p5_chr11.fa.gz',
      header: '>gi|224589802|ref|NC_000011.9| Homo sapiens chromosome 11, GRCh37.p5 Primary Assembly',
      nucleotides: 135006516
    }, {
      file: 'hs_ref_GRCh37.p5_chr12.fa.gz',
      header: '>gi|224589803|ref|NC_000012.11| Homo sapiens chromosome 12, GRCh37.p5 Primary Assembly',
      nucleotides: 133851895
    }, {
      file: 'hs_ref_GRCh37.p5_chr13.fa.gz',
      header: '>gi|224589804|ref|NC_000013.10| Homo sapiens chromosome 13, GRCh37.p5 Primary Assembly',
      nucleotides: 115169878
    }, {
      file: 'hs_ref_GRCh37.p5_chr14.fa.gz',
      header: '>gi|224589805|ref|NC_000014.8| Homo sapiens chromosome 14, GRCh37.p5 Primary Assembly',
      nucleotides: 107349540
    }, {
      file: 'hs_ref_GRCh37.p5_chr15.fa.gz',
      header: '>gi|224589806|ref|NC_000015.9| Homo sapiens chromosome 15, GRCh37.p5 Primary Assembly',
      nucleotides: 102531392
    }, {
      file: 'hs_ref_GRCh37.p5_chr16.fa.gz',
      header: '>gi|224589807|ref|NC_000016.9| Homo sapiens chromosome 16, GRCh37.p5 Primary Assembly',
      nucleotides: 90354753
    }, {
      file: 'hs_ref_GRCh37.p5_chr17.fa.gz',
      header: '>gi|224589808|ref|NC_000017.10| Homo sapiens chromosome 17, GRCh37.p5 Primary Assembly',
      nucleotides: 81195210
    }, {
      file: 'hs_ref_GRCh37.p5_chr18.fa.gz',
      header: '>gi|224589809|ref|NC_000018.9| Homo sapiens chromosome 18, GRCh37.p5 Primary Assembly',
      nucleotides: 78077248
    }, {
      file: 'hs_ref_GRCh37.p5_chr19.fa.gz',
      header: '>gi|224589810|ref|NC_000019.9| Homo sapiens chromosome 19, GRCh37.p5 Primary Assembly',
      nucleotides: 59128983
    }, {
      file: 'hs_ref_GRCh37.p5_chr20.fa.gz',
      header: '>gi|224589812|ref|NC_000020.10| Homo sapiens chromosome 20, GRCh37.p5 Primary Assembly',
      nucleotides: 63025520
    }, {
      file: 'hs_ref_GRCh37.p5_chr21.fa.gz',
      header: '>gi|224589813|ref|NC_000021.8| Homo sapiens chromosome 21, GRCh37.p5 Primary Assembly',
      nucleotides: 48129895
    }, {
      file: 'hs_ref_GRCh37.p5_chr22.fa.gz',
      header: '>gi|224589814|ref|NC_000022.10| Homo sapiens chromosome 22, GRCh37.p5 Primary Assembly',
      nucleotides: 51304566
    }, {
      file: 'hs_ref_GRCh37.p5_chrX.fa.gz',
      header: '>gi|224589822|ref|NC_000023.10| Homo sapiens chromosome X, GRCh37.p5 Primary Assembly',
      nucleotides: 155270560
    }, {
      file: 'hs_ref_GRCh37.p5_chrY.fa.gz',
      header: '>gi|224589823|ref|NC_000024.9| Homo sapiens chromosome Y, GRCh37.p5 Primary Assembly',
      nucleotides: 59373566
    }, {
      file: 'hs_ref_GRCh37.p5_chrMT.fa.gz',
      header: '>gi|251831106|ref|NC_012920.1| Homo sapiens mitochondrion, complete genome',
      nucleotides: 16569
    }]
  }, {
    taxid: 9601,
    name: 'Pongo abelii (Sumatran orangutan)',
    ncbiBuild: 1,
    version: 3,
    releaseDate: '25 July 2012',
    nucleotides: 3029507528,
    files: [{
      file: 'pab_ref_P_pygmaeus_2.0.2_chr1.fa.gz',
      header: '>gi|241864942|ref|NC_012591.1| Pongo abelii chromosome 1, P_pygmaeus_2.0.2',
      nucleotides: 229942017
    }, {
      file: 'pab_ref_P_pygmaeus_2.0.2_chr2A.fa.gz',
      header: '>gi|241864941|ref|NC_012592.1| Pongo abelii chromosome 2A, P_pygmaeus_2.0.2',
      nucleotides: 113028656
    }, {
      file: 'pab_ref_P_pygmaeus_2.0.2_chr2B.fa.gz',
      header: '>gi|241864940|ref|NC_012593.1| Pongo abelii chromosome 2B, P_pygmaeus_2.0.2',
      nucleotides: 135000294
    }, {
      file: 'pab_ref_P_pygmaeus_2.0.2_chr3.fa.gz',
      header: '>gi|241864939|ref|NC_012594.1| Pongo abelii chromosome 3, P_pygmaeus_2.0.2',
      nucleotides: 202140232
    }, {
      file: 'pab_ref_P_pygmaeus_2.0.2_chr4.fa.gz',
      header: '>gi|241864938|ref|NC_012595.1| Pongo abelii chromosome 4, P_pygmaeus_2.0.2',
      nucleotides: 198332218
    }, {
      file: 'pab_ref_P_pygmaeus_2.0.2_chr5.fa.gz',
      header: '>gi|241864937|ref|NC_012596.1| Pongo abelii chromosome 5, P_pygmaeus_2.0.2',
      nucleotides: 183952662
    }, {
      file: 'pab_ref_P_pygmaeus_2.0.2_chr6.fa.gz',
      header: '>gi|241864936|ref|NC_012597.1| Pongo abelii chromosome 6, P_pygmaeus_2.0.2',
      nucleotides: 174210431
    }, {
      file: 'pab_ref_P_pygmaeus_2.0.2_chr7.fa.gz',
      header: '>gi|241864935|ref|NC_012598.1| Pongo abelii chromosome 7, P_pygmaeus_2.0.2',
      nucleotides: 157549271
    }, {
      file: 'pab_ref_P_pygmaeus_2.0.2_chr8.fa.gz',
      header: '>gi|241864934|ref|NC_012599.1| Pongo abelii chromosome 8, P_pygmaeus_2.0.2',
      nucleotides: 153482349
    }, {
      file: 'pab_ref_P_pygmaeus_2.0.2_chr9.fa.gz',
      header: '>gi|241864933|ref|NC_012600.1| Pongo abelii chromosome 9, P_pygmaeus_2.0.2',
      nucleotides: 135191526
    }, {
      file: 'pab_ref_P_pygmaeus_2.0.2_chr10.fa.gz',
      header: '>gi|241864932|ref|NC_012601.1| Pongo abelii chromosome 10, P_pygmaeus_2.0.2',
      nucleotides: 133410057
    }, {
      file: 'pab_ref_P_pygmaeus_2.0.2_chr11.fa.gz',
      header: '>gi|241864931|ref|NC_012602.1| Pongo abelii chromosome 11, P_pygmaeus_2.0.2',
      nucleotides: 132107971
    }, {
      file: 'pab_ref_P_pygmaeus_2.0.2_chr12.fa.gz',
      header: '>gi|241864930|ref|NC_012603.1| Pongo abelii chromosome 12, P_pygmaeus_2.0.2',
      nucleotides: 136387465
    }, {
      file: 'pab_ref_P_pygmaeus_2.0.2_chr13.fa.gz',
      header: '>gi|241864929|ref|NC_012604.1| Pongo abelii chromosome 13, P_pygmaeus_2.0.2',
      nucleotides: 117095149
    }, {
      file: 'pab_ref_P_pygmaeus_2.0.2_chr14.fa.gz',
      header: '>gi|241864928|ref|NC_012605.1| Pongo abelii chromosome 14, P_pygmaeus_2.0.2',
      nucleotides: 108868599
    }, {
      file: 'pab_ref_P_pygmaeus_2.0.2_chr15.fa.gz',
      header: '>gi|241864927|ref|NC_012606.1| Pongo abelii chromosome 15, P_pygmaeus_2.0.2',
      nucleotides: 99152023
    }, {
      file: 'pab_ref_P_pygmaeus_2.0.2_chr16.fa.gz',
      header: '>gi|241864926|ref|NC_012607.1| Pongo abelii chromosome 16, P_pygmaeus_2.0.2',
      nucleotides: 77800216
    }, {
      file: 'pab_ref_P_pygmaeus_2.0.2_chr17.fa.gz',
      header: '>gi|241864925|ref|NC_012608.1| Pongo abelii chromosome 17, P_pygmaeus_2.0.2',
      nucleotides: 73212453
    }, {
      file: 'pab_ref_P_pygmaeus_2.0.2_chr18.fa.gz',
      header: '>gi|241864924|ref|NC_012609.1| Pongo abelii chromosome 18, P_pygmaeus_2.0.2',
      nucleotides: 94050890
    }, {
      file: 'pab_ref_P_pygmaeus_2.0.2_chr19.fa.gz',
      header: '>gi|241864923|ref|NC_012610.1| Pongo abelii chromosome 19, P_pygmaeus_2.0.2',
      nucleotides: 60714840
    }, {
      file: 'pab_ref_P_pygmaeus_2.0.2_chr20.fa.gz',
      header: '>gi|241864922|ref|NC_012611.1| Pongo abelii chromosome 20, P_pygmaeus_2.0.2',
      nucleotides: 62736349
    }, {
      file: 'pab_ref_P_pygmaeus_2.0.2_chr21.fa.gz',
      header: '>gi|241864921|ref|NC_012612.1| Pongo abelii chromosome 21, P_pygmaeus_2.0.2',
      nucleotides: 48394510
    }, {
      file: 'pab_ref_P_pygmaeus_2.0.2_chr22.fa.gz',
      header: '>gi|241864895|ref|NC_012613.1| Pongo abelii chromosome 22, P_pygmaeus_2.0.2',
      nucleotides: 46535552
    }, {
      file: 'pab_ref_P_pygmaeus_2.0.2_chrX.fa.gz',
      header: '>gi|241864894|ref|NC_012614.1| Pongo abelii chromosome X, P_pygmaeus_2.0.2',
      nucleotides: 156195299
    }, {
      file: 'pab_ref_P_pygmaeus_2.0.2_chrMT.fa.gz',
      header: '>gi|5835834|ref|NC_002083.1| Pongo abelii mitochondrion, complete genome',
      nucleotides: 16499
    }]
  }, {
    taxid: 10116,
    name: 'Rattus norvegicus (rat)',
    ncbiBuild: 5,
    version: 1,
    releaseDate: '6 July 2012',
    nucleotides: 2902605281,
    files: [{
      file: 'rn_ref_Rnor_5.0_chr1.fa.gz',
      header: '>gi|389675128|ref|NC_005100.3| Rattus norvegicus strain BN/SsNHsdMCW chromosome 1, Rnor_5.0',
      nucleotides: 290094216
    }, {
      file: 'rn_ref_Rnor_5.0_chr2.fa.gz',
      header: '>gi|389675127|ref|NC_005101.3| Rattus norvegicus strain BN/SsNHsdMCW chromosome 2, Rnor_5.0',
      nucleotides: 285068071
    }, {
      file: 'rn_ref_Rnor_5.0_chr3.fa.gz',
      header: '>gi|389675126|ref|NC_005102.3| Rattus norvegicus strain BN/SsNHsdMCW chromosome 3, Rnor_5.0',
      nucleotides: 183740530
    }, {
      file: 'rn_ref_Rnor_5.0_chr4.fa.gz',
      header: '>gi|389675125|ref|NC_005103.3| Rattus norvegicus strain BN/SsNHsdMCW chromosome 4, Rnor_5.0',
      nucleotides: 248343840
    }, {
      file: 'rn_ref_Rnor_5.0_chr5.fa.gz',
      header: '>gi|389675124|ref|NC_005104.3| Rattus norvegicus strain BN/SsNHsdMCW chromosome 5, Rnor_5.0',
      nucleotides: 177180328
    }, {
      file: 'rn_ref_Rnor_5.0_chr6.fa.gz',
      header: '>gi|389675123|ref|NC_005105.3| Rattus norvegicus strain BN/SsNHsdMCW chromosome 6, Rnor_5.0',
      nucleotides: 156897508
    }, {
      file: 'rn_ref_Rnor_5.0_chr7.fa.gz',
      header: '>gi|389675122|ref|NC_005106.3| Rattus norvegicus strain BN/SsNHsdMCW chromosome 7, Rnor_5.0',
      nucleotides: 143501887
    }, {
      file: 'rn_ref_Rnor_5.0_chr8.fa.gz',
      header: '>gi|389675121|ref|NC_005107.3| Rattus norvegicus strain BN/SsNHsdMCW chromosome 8, Rnor_5.0',
      nucleotides: 132457389
    }, {
      file: 'rn_ref_Rnor_5.0_chr9.fa.gz',
      header: '>gi|389675120|ref|NC_005108.3| Rattus norvegicus strain BN/SsNHsdMCW chromosome 9, Rnor_5.0',
      nucleotides: 121549591
    }, {
      file: 'rn_ref_Rnor_5.0_chr10.fa.gz',
      header: '>gi|389675119|ref|NC_005109.3| Rattus norvegicus strain BN/SsNHsdMCW chromosome 10, Rnor_5.0',
      nucleotides: 112200500
    }, {
      file: 'rn_ref_Rnor_5.0_chr11.fa.gz',
      header: '>gi|389675118|ref|NC_005110.3| Rattus norvegicus strain BN/SsNHsdMCW chromosome 11, Rnor_5.0',
      nucleotides: 93518069
    }, {
      file: 'rn_ref_Rnor_5.0_chr12.fa.gz',
      header: '>gi|389675117|ref|NC_005111.3| Rattus norvegicus strain BN/SsNHsdMCW chromosome 12, Rnor_5.0',
      nucleotides: 54450796
    }, {
      file: 'rn_ref_Rnor_5.0_chr13.fa.gz',
      header: '>gi|389675116|ref|NC_005112.3| Rattus norvegicus strain BN/SsNHsdMCW chromosome 13, Rnor_5.0',
      nucleotides: 118718031
    }, {
      file: 'rn_ref_Rnor_5.0_chr14.fa.gz',
      header: '>gi|389675115|ref|NC_005113.3| Rattus norvegicus strain BN/SsNHsdMCW chromosome 14, Rnor_5.0',
      nucleotides: 115151701
    }, {
      file: 'rn_ref_Rnor_5.0_chr15.fa.gz',
      header: '>gi|389675114|ref|NC_005114.3| Rattus norvegicus strain BN/SsNHsdMCW chromosome 15, Rnor_5.0',
      nucleotides: 114627140
    }, {
      file: 'rn_ref_Rnor_5.0_chr16.fa.gz',
      header: '>gi|389675113|ref|NC_005115.3| Rattus norvegicus strain BN/SsNHsdMCW chromosome 16, Rnor_5.0',
      nucleotides: 90051983
    }, {
      file: 'rn_ref_Rnor_5.0_chr17.fa.gz',
      header: '>gi|389675112|ref|NC_005116.3| Rattus norvegicus strain BN/SsNHsdMCW chromosome 17, Rnor_5.0',
      nucleotides: 92503511
    }, {
      file: 'rn_ref_Rnor_5.0_chr18.fa.gz',
      header: '>gi|389675111|ref|NC_005117.3| Rattus norvegicus strain BN/SsNHsdMCW chromosome 18, Rnor_5.0',
      nucleotides: 87229863
    }, {
      file: 'rn_ref_Rnor_5.0_chr19.fa.gz',
      header: '>gi|389675110|ref|NC_005118.3| Rattus norvegicus strain BN/SsNHsdMCW chromosome 19, Rnor_5.0',
      nucleotides: 72914587
    }, {
      file: 'rn_ref_Rnor_5.0_chr20.fa.gz',
      header: '>gi|389675109|ref|NC_005119.3| Rattus norvegicus strain BN/SsNHsdMCW chromosome 20, Rnor_5.0',
      nucleotides: 57791882
    }, {
      file: 'rn_ref_Rnor_5.0_chrX.fa.gz',
      header: '>gi|389675108|ref|NC_005120.3| Rattus norvegicus strain BN/SsNHsdMCW chromosome X, Rnor_5.0',
      nucleotides: 154597545
    }, {
      file: 'rn_ref_Rnor_5.0_chrMT.fa.gz',
      header: '>gi|110189714|ref|NC_001665.2| Rattus norvegicus strain BN/SsNHsdMCW mitochondrion, complete genome',
      nucleotides: 16313
    }]
  }, {
    taxid: 9544,
    name: 'Macaca mulatta (rhesus monkey)',
    ncbiBuild: 1,
    version: 2,
    releaseDate: '14 October 2010',
    nucleotides: 2863681749,
    files: [{
      file: 'mmu_ref_Mmul_051212_chr1.fa.gz',
      header: '>gi|109156578|ref|NC_007858.1| Macaca mulatta chromosome 1, Mmul_051212 chromosome, whole genome shotgun sequence',
      nucleotides: 228252215
    }, {
      file: 'mmu_ref_Mmul_051212_chr2.fa.gz',
      header: '>gi|109156887|ref|NC_007859.1| Macaca mulatta chromosome 2, Mmul_051212 chromosome, whole genome shotgun sequence',
      nucleotides: 189746636
    }, {
      file: 'mmu_ref_Mmul_051212_chr3.fa.gz',
      header: '>gi|109156890|ref|NC_007860.1| Macaca mulatta chromosome 3, Mmul_051212 chromosome, whole genome shotgun sequence',
      nucleotides: 196418989
    }, {
      file: 'mmu_ref_Mmul_051212_chr4.fa.gz',
      header: '>gi|109156893|ref|NC_007861.1| Macaca mulatta chromosome 4, Mmul_051212 chromosome, whole genome shotgun sequence',
      nucleotides: 167655696
    }, {
      file: 'mmu_ref_Mmul_051212_chr5.fa.gz',
      header: '>gi|109156895|ref|NC_007862.1| Macaca mulatta chromosome 5, Mmul_051212 chromosome, whole genome shotgun sequence',
      nucleotides: 182086969
    }, {
      file: 'mmu_ref_Mmul_051212_chr6.fa.gz',
      header: '>gi|109157119|ref|NC_007863.1| Macaca mulatta chromosome 6, Mmul_051212 chromosome, whole genome shotgun sequence',
      nucleotides: 178205221
    }, {
      file: 'mmu_ref_Mmul_051212_chr7.fa.gz',
      header: '>gi|109158192|ref|NC_007864.1| Macaca mulatta chromosome 7, Mmul_051212 chromosome, whole genome shotgun sequence',
      nucleotides: 169801366
    }, {
      file: 'mmu_ref_Mmul_051212_chr8.fa.gz',
      header: '>gi|109158193|ref|NC_007865.1| Macaca mulatta chromosome 8, Mmul_051212 chromosome, whole genome shotgun sequence',
      nucleotides: 147794981
    }, {
      file: 'mmu_ref_Mmul_051212_chr9.fa.gz',
      header: '>gi|109158194|ref|NC_007866.1| Macaca mulatta chromosome 9, Mmul_051212 chromosome, whole genome shotgun sequence',
      nucleotides: 133323859
    }, {
      file: 'mmu_ref_Mmul_051212_chr10.fa.gz',
      header: '>gi|109156579|ref|NC_007867.1| Macaca mulatta chromosome 10, Mmul_051212 chromosome, whole genome shotgun sequence',
      nucleotides: 94855758
    }, {
      file: 'mmu_ref_Mmul_051212_chr11.fa.gz',
      header: '>gi|109156580|ref|NC_007868.1| Macaca mulatta chromosome 11, Mmul_051212 chromosome, whole genome shotgun sequence',
      nucleotides: 134511895
    }, {
      file: 'mmu_ref_Mmul_051212_chr12.fa.gz',
      header: '>gi|109156645|ref|NC_007869.1| Macaca mulatta chromosome 12, Mmul_051212 chromosome, whole genome shotgun sequence',
      nucleotides: 106505843
    }, {
      file: 'mmu_ref_Mmul_051212_chr13.fa.gz',
      header: '>gi|109156646|ref|NC_007870.1| Macaca mulatta chromosome 13, Mmul_051212 chromosome, whole genome shotgun sequence',
      nucleotides: 138028943
    }, {
      file: 'mmu_ref_Mmul_051212_chr14.fa.gz',
      header: '>gi|109156648|ref|NC_007871.1| Macaca mulatta chromosome 14, Mmul_051212 chromosome, whole genome shotgun sequence',
      nucleotides: 133002572
    }, {
      file: 'mmu_ref_Mmul_051212_chr15.fa.gz',
      header: '>gi|109156649|ref|NC_007872.1| Macaca mulatta chromosome 15, Mmul_051212 chromosome, whole genome shotgun sequence',
      nucleotides: 110119387
    }, {
      file: 'mmu_ref_Mmul_051212_chr16.fa.gz',
      header: '>gi|109156650|ref|NC_007873.1| Macaca mulatta chromosome 16, Mmul_051212 chromosome, whole genome shotgun sequence',
      nucleotides: 78773432
    }, {
      file: 'mmu_ref_Mmul_051212_chr17.fa.gz',
      header: '>gi|109156884|ref|NC_007874.1| Macaca mulatta chromosome 17, Mmul_051212 chromosome, whole genome shotgun sequence',
      nucleotides: 94452569
    }, {
      file: 'mmu_ref_Mmul_051212_chr18.fa.gz',
      header: '>gi|109156885|ref|NC_007875.1| Macaca mulatta chromosome 18, Mmul_051212 chromosome, whole genome shotgun sequence',
      nucleotides: 73567989
    }, {
      file: 'mmu_ref_Mmul_051212_chr19.fa.gz',
      header: '>gi|109156886|ref|NC_007876.1| Macaca mulatta chromosome 19, Mmul_051212 chromosome, whole genome shotgun sequence',
      nucleotides: 64391591
    }, {
      file: 'mmu_ref_Mmul_051212_chr20.fa.gz',
      header: '>gi|109156888|ref|NC_007877.1| Macaca mulatta chromosome 20, Mmul_051212 chromosome, whole genome shotgun sequence',
      nucleotides: 88221753
    }, {
      file: 'mmu_ref_Mmul_051212_chrX.fa.gz',
      header: '>gi|109158195|ref|NC_007878.1| Macaca mulatta chromosome X, Mmul_051212 chromosome, whole genome shotgun sequence',
      nucleotides: 153947521
    }, {
      file: 'mmu_chrMT.fa.gz',
      header: '>gi|49146236|ref|NC_005943.1| Macaca mulatta mitochondrion, complete genome',
      nucleotides: 16564
    }]
  }, {
    taxid: 9483,
    name: 'Callithrix jacchus (marmoset)',
    ncbiBuild: 1,
    version: 2,
    releaseDate: '12 July 2012',
    nucleotides: 2770219215,
    files: [{
      file: 'cja_ref_Callithrix_jacchus-3.2_chr1.fa.gz',
      header: '>gi|290467408|ref|NC_013896.1| Callithrix jacchus chromosome 1, Callithrix jacchus-3.2, whole genome shotgun sequence',
      nucleotides: 210400635
    }, {
      file: 'cja_ref_Callithrix_jacchus-3.2_chr2.fa.gz',
      header: '>gi|290467407|ref|NC_013897.1| Callithrix jacchus chromosome 2, Callithrix jacchus-3.2, whole genome shotgun sequence',
      nucleotides: 204313951
    }, {
      file: 'cja_ref_Callithrix_jacchus-3.2_chr3.fa.gz',
      header: '>gi|290467406|ref|NC_013898.1| Callithrix jacchus chromosome 3, Callithrix jacchus-3.2, whole genome shotgun sequence',
      nucleotides: 190850796
    }, {
      file: 'cja_ref_Callithrix_jacchus-3.2_chr4.fa.gz',
      header: '>gi|290467405|ref|NC_013899.1| Callithrix jacchus chromosome 4, Callithrix jacchus-3.2, whole genome shotgun sequence',
      nucleotides: 171630274
    }, {
      file: 'cja_ref_Callithrix_jacchus-3.2_chr5.fa.gz',
      header: '>gi|290467404|ref|NC_013900.1| Callithrix jacchus chromosome 5, Callithrix jacchus-3.2, whole genome shotgun sequence',
      nucleotides: 159171411
    }, {
      file: 'cja_ref_Callithrix_jacchus-3.2_chr6.fa.gz',
      header: '>gi|290467403|ref|NC_013901.1| Callithrix jacchus chromosome 6, Callithrix jacchus-3.2, whole genome shotgun sequence',
      nucleotides: 158406734
    }, {
      file: 'cja_ref_Callithrix_jacchus-3.2_chr7.fa.gz',
      header: '>gi|290467402|ref|NC_013902.1| Callithrix jacchus chromosome 7, Callithrix jacchus-3.2, whole genome shotgun sequence',
      nucleotides: 155834243
    }, {
      file: 'cja_ref_Callithrix_jacchus-3.2_chr8.fa.gz',
      header: '>gi|290467401|ref|NC_013903.1| Callithrix jacchus chromosome 8, Callithrix jacchus-3.2, whole genome shotgun sequence',
      nucleotides: 128169293
    }, {
      file: 'cja_ref_Callithrix_jacchus-3.2_chr9.fa.gz',
      header: '>gi|290467400|ref|NC_013904.1| Callithrix jacchus chromosome 9, Callithrix jacchus-3.2, whole genome shotgun sequence',
      nucleotides: 124281992
    }, {
      file: 'cja_ref_Callithrix_jacchus-3.2_chr10.fa.gz',
      header: '>gi|290467399|ref|NC_013905.1| Callithrix jacchus chromosome 10, Callithrix jacchus-3.2, whole genome shotgun sequence',
      nucleotides: 132174527
    }, {
      file: 'cja_ref_Callithrix_jacchus-3.2_chr11.fa.gz',
      header: '>gi|290467398|ref|NC_013906.1| Callithrix jacchus chromosome 11, Callithrix jacchus-3.2, whole genome shotgun sequence',
      nucleotides: 130397257
    }, {
      file: 'cja_ref_Callithrix_jacchus-3.2_chr12.fa.gz',
      header: '>gi|290467397|ref|NC_013907.1| Callithrix jacchus chromosome 12, Callithrix jacchus-3.2, whole genome shotgun sequence',
      nucleotides: 121768101
    }, {
      file: 'cja_ref_Callithrix_jacchus-3.2_chr13.fa.gz',
      header: '>gi|290467396|ref|NC_013908.1| Callithrix jacchus chromosome 13, Callithrix jacchus-3.2, whole genome shotgun sequence',
      nucleotides: 117903854
    }, {
      file: 'cja_ref_Callithrix_jacchus-3.2_chr14.fa.gz',
      header: '>gi|290467395|ref|NC_013909.1| Callithrix jacchus chromosome 14, Callithrix jacchus-3.2, whole genome shotgun sequence',
      nucleotides: 108792865
    }, {
      file: 'cja_ref_Callithrix_jacchus-3.2_chr15.fa.gz',
      header: '>gi|290467394|ref|NC_013910.1| Callithrix jacchus chromosome 15, Callithrix jacchus-3.2, whole genome shotgun sequence',
      nucleotides: 98464013
    }, {
      file: 'cja_ref_Callithrix_jacchus-3.2_chr16.fa.gz',
      header: '>gi|290467393|ref|NC_013911.1| Callithrix jacchus chromosome 16, Callithrix jacchus-3.2, whole genome shotgun sequence',
      nucleotides: 96796970
    }, {
      file: 'cja_ref_Callithrix_jacchus-3.2_chr17.fa.gz',
      header: '>gi|290467392|ref|NC_013912.1| Callithrix jacchus chromosome 17, Callithrix jacchus-3.2, whole genome shotgun sequence',
      nucleotides: 74750902
    }, {
      file: 'cja_ref_Callithrix_jacchus-3.2_chr18.fa.gz',
      header: '>gi|290467391|ref|NC_013913.1| Callithrix jacchus chromosome 18, Callithrix jacchus-3.2, whole genome shotgun sequence',
      nucleotides: 47448759
    }, {
      file: 'cja_ref_Callithrix_jacchus-3.2_chr19.fa.gz',
      header: '>gi|290467390|ref|NC_013914.1| Callithrix jacchus chromosome 19, Callithrix jacchus-3.2, whole genome shotgun sequence',
      nucleotides: 49578535
    }, {
      file: 'cja_ref_Callithrix_jacchus-3.2_chr20.fa.gz',
      header: '>gi|290467389|ref|NC_013915.1| Callithrix jacchus chromosome 20, Callithrix jacchus-3.2, whole genome shotgun sequence',
      nucleotides: 44557958
    }, {
      file: 'cja_ref_Callithrix_jacchus-3.2_chr21.fa.gz',
      header: '>gi|290467388|ref|NC_013916.1| Callithrix jacchus chromosome 21, Callithrix jacchus-3.2, whole genome shotgun sequence',
      nucleotides: 50472720
    }, {
      file: 'cja_ref_Callithrix_jacchus-3.2_chr22.fa.gz',
      header: '>gi|290467387|ref|NC_013917.1| Callithrix jacchus chromosome 22, Callithrix jacchus-3.2, whole genome shotgun sequence',
      nucleotides: 49145316
    }, {
      file: 'cja_ref_Callithrix_jacchus-3.2_chrX.fa.gz',
      header: '>gi|290467386|ref|NC_013918.1| Callithrix jacchus chromosome X, Callithrix jacchus-3.2, whole genome shotgun sequence',
      nucleotides: 142054208
    }, {
      file: 'cja_ref_Callithrix_jacchus-3.2_chrY.fa.gz',
      header: '>gi|290467385|ref|NC_013919.1| Callithrix jacchus chromosome Y, Callithrix jacchus-3.2, whole genome shotgun sequence',
      nucleotides: 2853901
    }]
  }, {
    taxid: 10090,
    name: 'Mus musculus (mouse)',
    ncbiBuild: 38,
    version: 1,
    releaseDate: 'March 22 2012',
    nucleotides: 2725537669,
    files: [{
      file: 'mm_ref_GRCm38_chr1.fa.gz',
      header: '>gi|372099109|ref|NC_000067.6| Mus musculus strain C57BL/6J chromosome 1, GRCm38 C57BL/6J',
      nucleotides: 195471971
    }, {
      file: 'mm_ref_GRCm38_chr2.fa.gz',
      header: '>gi|372099108|ref|NC_000068.7| Mus musculus strain C57BL/6J chromosome 2, GRCm38 C57BL/6J',
      nucleotides: 182113224
    }, {
      file: 'mm_ref_GRCm38_chr3.fa.gz',
      header: '>gi|372099107|ref|NC_000069.6| Mus musculus strain C57BL/6J chromosome 3, GRCm38 C57BL/6J',
      nucleotides: 160039680
    }, {
      file: 'mm_ref_GRCm38_chr4.fa.gz',
      header: '>gi|372099106|ref|NC_000070.6| Mus musculus strain C57BL/6J chromosome 4, GRCm38 C57BL/6J',
      nucleotides: 156508116
    }, {
      file: 'mm_ref_GRCm38_chr5.fa.gz',
      header: '>gi|372099105|ref|NC_000071.6| Mus musculus strain C57BL/6J chromosome 5, GRCm38 C57BL/6J',
      nucleotides: 151834684
    }, {
      file: 'mm_ref_GRCm38_chr6.fa.gz',
      header: '>gi|372099104|ref|NC_000072.6| Mus musculus strain C57BL/6J chromosome 6, GRCm38 C57BL/6J',
      nucleotides: 149736546
    }, {
      file: 'mm_ref_GRCm38_chr7.fa.gz',
      header: '>gi|372099103|ref|NC_000073.6| Mus musculus strain C57BL/6J chromosome 7, GRCm38 C57BL/6J',
      nucleotides: 145441459
    }, {
      file: 'mm_ref_GRCm38_chr8.fa.gz',
      header: '>gi|372099102|ref|NC_000074.6| Mus musculus strain C57BL/6J chromosome 8, GRCm38 C57BL/6J',
      nucleotides: 129401213
    }, {
      file: 'mm_ref_GRCm38_chr9.fa.gz',
      header: '>gi|372099101|ref|NC_000075.6| Mus musculus strain C57BL/6J chromosome 9, GRCm38 C57BL/6J',
      nucleotides: 124595110
    }, {
      file: 'mm_ref_GRCm38_chr10.fa.gz',
      header: '>gi|372099100|ref|NC_000076.6| Mus musculus strain C57BL/6J chromosome 10, GRCm38 C57BL/6J',
      nucleotides: 130694993
    }, {
      file: 'mm_ref_GRCm38_chr11.fa.gz',
      header: '>gi|372099099|ref|NC_000077.6| Mus musculus strain C57BL/6J chromosome 11, GRCm38 C57BL/6J',
      nucleotides: 122082543
    }, {
      file: 'mm_ref_GRCm38_chr12.fa.gz',
      header: '>gi|372099098|ref|NC_000078.6| Mus musculus strain C57BL/6J chromosome 12, GRCm38 C57BL/6J',
      nucleotides: 120129022
    }, {
      file: 'mm_ref_GRCm38_chr13.fa.gz',
      header: '>gi|372099097|ref|NC_000079.6| Mus musculus strain C57BL/6J chromosome 13, GRCm38 C57BL/6J',
      nucleotides: 120421639
    }, {
      file: 'mm_ref_GRCm38_chr14.fa.gz',
      header: '>gi|372099096|ref|NC_000080.6| Mus musculus strain C57BL/6J chromosome 14, GRCm38 C57BL/6J',
      nucleotides: 124902244
    }, {
      file: 'mm_ref_GRCm38_chr15.fa.gz',
      header: '>gi|372099095|ref|NC_000081.6| Mus musculus strain C57BL/6J chromosome 15, GRCm38 C57BL/6J',
      nucleotides: 104043685
    }, {
      file: 'mm_ref_GRCm38_chr16.fa.gz',
      header: '>gi|372099094|ref|NC_000082.6| Mus musculus strain C57BL/6J chromosome 16, GRCm38 C57BL/6J',
      nucleotides: 98207768
    }, {
      file: 'mm_ref_GRCm38_chr17.fa.gz',
      header: '>gi|372099093|ref|NC_000083.6| Mus musculus strain C57BL/6J chromosome 17, GRCm38 C57BL/6J',
      nucleotides: 94987271
    }, {
      file: 'mm_ref_GRCm38_chr18.fa.gz',
      header: '>gi|372099092|ref|NC_000084.6| Mus musculus strain C57BL/6J chromosome 18, GRCm38 C57BL/6J',
      nucleotides: 90702639
    }, {
      file: 'mm_ref_GRCm38_chr19.fa.gz',
      header: '>gi|372099091|ref|NC_000085.6| Mus musculus strain C57BL/6J chromosome 19, GRCm38 C57BL/6J',
      nucleotides: 61431566
    }, {
      file: 'mm_ref_GRCm38_chrX.fa.gz',
      header: '>gi|372099090|ref|NC_000086.7| Mus musculus strain C57BL/6J chromosome X, GRCm38 C57BL/6J',
      nucleotides: 171031299
    }, {
      file: 'mm_ref_GRCm38_chrY.fa.gz',
      header: '>gi|372099089|ref|NC_000087.7| Mus musculus strain C57BL/6J chromosome Y, GRCm38 C57BL/6J',
      nucleotides: 91744698
    }, {
      file: 'mm_ref_GRCm38_chrMT.fa.gz',
      header: '>gi|34538597|ref|NC_005089.1| Mus musculus mitochondrion, complete genome',
      nucleotides: 16299
    }]
  }, {
    taxid: 9913,
    name: 'Bos taurus (cow)',
    ncbiBuild: 6,
    version: 1,
    releaseDate: '21 December 2011',
    nucleotides: 2660922743,
    files: [{
      file: 'bt_ref_Bos_taurus_UMD_3.1_chr1.fa.gz',
      header: '>gi|258517435|ref|AC_000158.1| Bos taurus breed Hereford chromosome 1, Bos_taurus_UMD_3.1, whole genome shotgun sequence',
      nucleotides: 158337067
    }, {
      file: 'bt_ref_Bos_taurus_UMD_3.1_chr2.fa.gz',
      header: '>gi|258513365|ref|AC_000159.1| Bos taurus breed Hereford chromosome 2, Bos_taurus_UMD_3.1, whole genome shotgun sequence',
      nucleotides: 137060424
    }, {
      file: 'bt_ref_Bos_taurus_UMD_3.1_chr3.fa.gz',
      header: '>gi|258513364|ref|AC_000160.1| Bos taurus breed Hereford chromosome 3, Bos_taurus_UMD_3.1, whole genome shotgun sequence',
      nucleotides: 121430405
    }, {
      file: 'bt_ref_Bos_taurus_UMD_3.1_chr4.fa.gz',
      header: '>gi|258513363|ref|AC_000161.1| Bos taurus breed Hereford chromosome 4, Bos_taurus_UMD_3.1, whole genome shotgun sequence',
      nucleotides: 120829699
    }, {
      file: 'bt_ref_Bos_taurus_UMD_3.1_chr5.fa.gz',
      header: '>gi|258513362|ref|AC_000162.1| Bos taurus breed Hereford chromosome 5, Bos_taurus_UMD_3.1, whole genome shotgun sequence',
      nucleotides: 121191424
    }, {
      file: 'bt_ref_Bos_taurus_UMD_3.1_chr6.fa.gz',
      header: '>gi|258513361|ref|AC_000163.1| Bos taurus breed Hereford chromosome 6, Bos_taurus_UMD_3.1, whole genome shotgun sequence',
      nucleotides: 119458736
    }, {
      file: 'bt_ref_Bos_taurus_UMD_3.1_chr7.fa.gz',
      header: '>gi|258513360|ref|AC_000164.1| Bos taurus breed Hereford chromosome 7, Bos_taurus_UMD_3.1, whole genome shotgun sequence',
      nucleotides: 112638659
    }, {
      file: 'bt_ref_Bos_taurus_UMD_3.1_chr8.fa.gz',
      header: '>gi|258513359|ref|AC_000165.1| Bos taurus breed Hereford chromosome 8, Bos_taurus_UMD_3.1, whole genome shotgun sequence',
      nucleotides: 113384836
    }, {
      file: 'bt_ref_Bos_taurus_UMD_3.1_chr9.fa.gz',
      header: '>gi|258513358|ref|AC_000166.1| Bos taurus breed Hereford chromosome 9, Bos_taurus_UMD_3.1, whole genome shotgun sequence',
      nucleotides: 105708250
    }, {
      file: 'bt_ref_Bos_taurus_UMD_3.1_chr10.fa.gz',
      header: '>gi|258513357|ref|AC_000167.1| Bos taurus breed Hereford chromosome 10, Bos_taurus_UMD_3.1, whole genome shotgun sequence',
      nucleotides: 104305016
    }, {
      file: 'bt_ref_Bos_taurus_UMD_3.1_chr11.fa.gz',
      header: '>gi|258513356|ref|AC_000168.1| Bos taurus breed Hereford chromosome 11, Bos_taurus_UMD_3.1, whole genome shotgun sequence',
      nucleotides: 107310763
    }, {
      file: 'bt_ref_Bos_taurus_UMD_3.1_chr12.fa.gz',
      header: '>gi|258513355|ref|AC_000169.1| Bos taurus breed Hereford chromosome 12, Bos_taurus_UMD_3.1, whole genome shotgun sequence',
      nucleotides: 91163125
    }, {
      file: 'bt_ref_Bos_taurus_UMD_3.1_chr13.fa.gz',
      header: '>gi|258513354|ref|AC_000170.1| Bos taurus breed Hereford chromosome 13, Bos_taurus_UMD_3.1, whole genome shotgun sequence',
      nucleotides: 84240350
    }, {
      file: 'bt_ref_Bos_taurus_UMD_3.1_chr14.fa.gz',
      header: '>gi|258513353|ref|AC_000171.1| Bos taurus breed Hereford chromosome 14, Bos_taurus_UMD_3.1, whole genome shotgun sequence',
      nucleotides: 84648390
    }, {
      file: 'bt_ref_Bos_taurus_UMD_3.1_chr15.fa.gz',
      header: '>gi|258513352|ref|AC_000172.1| Bos taurus breed Hereford chromosome 15, Bos_taurus_UMD_3.1, whole genome shotgun sequence',
      nucleotides: 85296676
    }, {
      file: 'bt_ref_Bos_taurus_UMD_3.1_chr16.fa.gz',
      header: '>gi|258513351|ref|AC_000173.1| Bos taurus breed Hereford chromosome 16, Bos_taurus_UMD_3.1, whole genome shotgun sequence',
      nucleotides: 81724687
    }, {
      file: 'bt_ref_Bos_taurus_UMD_3.1_chr17.fa.gz',
      header: '>gi|258513350|ref|AC_000174.1| Bos taurus breed Hereford chromosome 17, Bos_taurus_UMD_3.1, whole genome shotgun sequence',
      nucleotides: 75158596
    }, {
      file: 'bt_ref_Bos_taurus_UMD_3.1_chr18.fa.gz',
      header: '>gi|258513349|ref|AC_000175.1| Bos taurus breed Hereford chromosome 18, Bos_taurus_UMD_3.1, whole genome shotgun sequence',
      nucleotides: 66004023
    }, {
      file: 'bt_ref_Bos_taurus_UMD_3.1_chr19.fa.gz',
      header: '>gi|258513348|ref|AC_000176.1| Bos taurus breed Hereford chromosome 19, Bos_taurus_UMD_3.1, whole genome shotgun sequence',
      nucleotides: 64057457
    }, {
      file: 'bt_ref_Bos_taurus_UMD_3.1_chr20.fa.gz',
      header: '>gi|258513347|ref|AC_000177.1| Bos taurus breed Hereford chromosome 20, Bos_taurus_UMD_3.1, whole genome shotgun sequence',
      nucleotides: 72042655
    }, {
      file: 'bt_ref_Bos_taurus_UMD_3.1_chr21.fa.gz',
      header: '>gi|258513346|ref|AC_000178.1| Bos taurus breed Hereford chromosome 21, Bos_taurus_UMD_3.1, whole genome shotgun sequence',
      nucleotides: 71599096
    }, {
      file: 'bt_ref_Bos_taurus_UMD_3.1_chr22.fa.gz',
      header: '>gi|258513345|ref|AC_000179.1| Bos taurus breed Hereford chromosome 22, Bos_taurus_UMD_3.1, whole genome shotgun sequence',
      nucleotides: 61435874
    }, {
      file: 'bt_ref_Bos_taurus_UMD_3.1_chr23.fa.gz',
      header: '>gi|258513344|ref|AC_000180.1| Bos taurus breed Hereford chromosome 23, Bos_taurus_UMD_3.1, whole genome shotgun sequence',
      nucleotides: 52530062
    }, {
      file: 'bt_ref_Bos_taurus_UMD_3.1_chr24.fa.gz',
      header: '>gi|258513343|ref|AC_000181.1| Bos taurus breed Hereford chromosome 24, Bos_taurus_UMD_3.1, whole genome shotgun sequence',
      nucleotides: 62714930
    }, {
      file: 'bt_ref_Bos_taurus_UMD_3.1_chr25.fa.gz',
      header: '>gi|258513342|ref|AC_000182.1| Bos taurus breed Hereford chromosome 25, Bos_taurus_UMD_3.1, whole genome shotgun sequence',
      nucleotides: 42904170
    }, {
      file: 'bt_ref_Bos_taurus_UMD_3.1_chr26.fa.gz',
      header: '>gi|258513341|ref|AC_000183.1| Bos taurus breed Hereford chromosome 26, Bos_taurus_UMD_3.1, whole genome shotgun sequence',
      nucleotides: 51681464
    }, {
      file: 'bt_ref_Bos_taurus_UMD_3.1_chr27.fa.gz',
      header: '>gi|258513340|ref|AC_000184.1| Bos taurus breed Hereford chromosome 27, Bos_taurus_UMD_3.1, whole genome shotgun sequence',
      nucleotides: 45407902
    }, {
      file: 'bt_ref_Bos_taurus_UMD_3.1_chr28.fa.gz',
      header: '>gi|258513339|ref|AC_000185.1| Bos taurus breed Hereford chromosome 28, Bos_taurus_UMD_3.1, whole genome shotgun sequence',
      nucleotides: 46312546
    }, {
      file: 'bt_ref_Bos_taurus_UMD_3.1_chr29.fa.gz',
      header: '>gi|258513338|ref|AC_000186.1| Bos taurus breed Hereford chromosome 29, Bos_taurus_UMD_3.1, whole genome shotgun sequence',
      nucleotides: 51505224
    }, {
      file: 'bt_ref_Bos_taurus_UMD_3.1_chrX.fa.gz',
      header: '>gi|258513337|ref|AC_000187.1| Bos taurus breed Hereford chromosome X, Bos_taurus_UMD_3.1, whole genome shotgun sequence',
      nucleotides: 148823899
    }, {
      file: 'bt_ref_Bos_taurus_UMD_3.1_chrMT.fa.gz',
      header: '>gi|60101824|ref|NC_006853.1| Bos taurus mitochondrion, complete genome',
      nucleotides: 16338
    }]
  }, {
    taxid: 9823,
    name: 'Sus scrofa (pig)',
    ncbiBuild: 4,
    version: 1,
    releaseDate: '21 December 2011',
    nucleotides: 2596656069,
    files: [{
      file: 'ssc_ref_Sscrofa10.2_chr1.fa.gz',
      header: '>gi|347618793|ref|NC_010443.4| Sus scrofa breed mixed chromosome 1, Sscrofa10.2',
      nucleotides: 315321322
    }, {
      file: 'ssc_ref_Sscrofa10.2_chr2.fa.gz',
      header: '>gi|347618792|ref|NC_010444.3| Sus scrofa breed mixed chromosome 2, Sscrofa10.2',
      nucleotides: 162569375
    }, {
      file: 'ssc_ref_Sscrofa10.2_chr3.fa.gz',
      header: '>gi|347618791|ref|NC_010445.3| Sus scrofa breed mixed chromosome 3, Sscrofa10.2',
      nucleotides: 144787322
    }, {
      file: 'ssc_ref_Sscrofa10.2_chr4.fa.gz',
      header: '>gi|347618790|ref|NC_010446.4| Sus scrofa breed mixed chromosome 4, Sscrofa10.2',
      nucleotides: 143465943
    }, {
      file: 'ssc_ref_Sscrofa10.2_chr5.fa.gz',
      header: '>gi|347618789|ref|NC_010447.4| Sus scrofa breed mixed chromosome 5, Sscrofa10.2',
      nucleotides: 111506441
    }, {
      file: 'ssc_ref_Sscrofa10.2_chr6.fa.gz',
      header: '>gi|347618788|ref|NC_010448.3| Sus scrofa breed mixed chromosome 6, Sscrofa10.2',
      nucleotides: 157765593
    }, {
      file: 'ssc_ref_Sscrofa10.2_chr7.fa.gz',
      header: '>gi|347618787|ref|NC_010449.4| Sus scrofa breed mixed chromosome 7, Sscrofa10.2',
      nucleotides: 134764511
    }, {
      file: 'ssc_ref_Sscrofa10.2_chr8.fa.gz',
      header: '>gi|347618786|ref|NC_010450.3| Sus scrofa breed mixed chromosome 8, Sscrofa10.2',
      nucleotides: 148491826
    }, {
      file: 'ssc_ref_Sscrofa10.2_chr9.fa.gz',
      header: '>gi|347618785|ref|NC_010451.3| Sus scrofa breed mixed chromosome 9, Sscrofa10.2',
      nucleotides: 153670197
    }, {
      file: 'ssc_ref_Sscrofa10.2_chr10.fa.gz',
      header: '>gi|347618784|ref|NC_010452.3| Sus scrofa breed mixed chromosome 10, Sscrofa10.2',
      nucleotides: 79102373
    }, {
      file: 'ssc_ref_Sscrofa10.2_chr11.fa.gz',
      header: '>gi|347618783|ref|NC_010453.4| Sus scrofa breed mixed chromosome 11, Sscrofa10.2',
      nucleotides: 87690581
    }, {
      file: 'ssc_ref_Sscrofa10.2_chr12.fa.gz',
      header: '>gi|347618782|ref|NC_010454.3| Sus scrofa breed mixed chromosome 12, Sscrofa10.2',
      nucleotides: 63588571
    }, {
      file: 'ssc_ref_Sscrofa10.2_chr13.fa.gz',
      header: '>gi|347618781|ref|NC_010455.4| Sus scrofa breed mixed chromosome 13, Sscrofa10.2',
      nucleotides: 218635234
    }, {
      file: 'ssc_ref_Sscrofa10.2_chr14.fa.gz',
      header: '>gi|347618780|ref|NC_010456.4| Sus scrofa breed mixed chromosome 14, Sscrofa10.2',
      nucleotides: 153851969
    }, {
      file: 'ssc_ref_Sscrofa10.2_chr15.fa.gz',
      header: '>gi|347618779|ref|NC_010457.4| Sus scrofa breed mixed chromosome 15, Sscrofa10.2',
      nucleotides: 157681621
    }, {
      file: 'ssc_ref_Sscrofa10.2_chr16.fa.gz',
      header: '>gi|347618778|ref|NC_010458.3| Sus scrofa breed mixed chromosome 16, Sscrofa10.2',
      nucleotides: 86898991
    }, {
      file: 'ssc_ref_Sscrofa10.2_chr17.fa.gz',
      header: '>gi|347618777|ref|NC_010459.4| Sus scrofa breed mixed chromosome 17, Sscrofa10.2',
      nucleotides: 69701581
    }, {
      file: 'ssc_ref_Sscrofa10.2_chr18.fa.gz',
      header: '>gi|347618776|ref|NC_010460.3| Sus scrofa breed mixed chromosome 18, Sscrofa10.2',
      nucleotides: 61220071
    }, {
      file: 'ssc_ref_Sscrofa10.2_chrX.fa.gz',
      header: '>gi|347618775|ref|NC_010461.4| Sus scrofa breed mixed chromosome X, Sscrofa10.2',
      nucleotides: 144288218
    }, {
      file: 'ssc_ref_Sscrofa10.2_chrY.fa.gz',
      header: '>gi|347618774|ref|NC_010462.2| Sus scrofa breed mixed chromosome Y, Sscrofa10.2',
      nucleotides: 1637716
    }, {
      file: 'ssc_ref_Sscrofa10.2_chrMT.fa.gz',
      header: '>gi|5835862|ref|NC_000845.1| Sus scrofa mitochondrion, complete genome',
      nucleotides: 16613
    }]
  }, {
    taxid: 9796,
    name: 'Equus caballus (horse)',
    ncbiBuild: 2,
    version: 2,
    releaseDate: '19 July 2011',
    nucleotides: 2367070107,
    files: [{
      file: 'eca_ref_EquCab2.0_chr1.fa.gz',
      header: '>gi|194246357|ref|NC_009144.2| Equus caballus breed thoroughbred chromosome 1, EquCab2.0, whole genome shotgun sequence',
      nucleotides: 185838109
    }, {
      file: 'eca_ref_EquCab2.0_chr2.fa.gz',
      header: '>gi|194246371|ref|NC_009145.2| Equus caballus breed thoroughbred chromosome 2, EquCab2.0, whole genome shotgun sequence',
      nucleotides: 120857687
    }, {
      file: 'eca_ref_EquCab2.0_chr3.fa.gz',
      header: '>gi|194246382|ref|NC_009146.2| Equus caballus breed thoroughbred chromosome 3, EquCab2.0, whole genome shotgun sequence',
      nucleotides: 119479920
    }, {
      file: 'eca_ref_EquCab2.0_chr4.fa.gz',
      header: '>gi|194246385|ref|NC_009147.2| Equus caballus breed thoroughbred chromosome 4, EquCab2.0, whole genome shotgun sequence',
      nucleotides: 108569075
    }, {
      file: 'eca_ref_EquCab2.0_chr5.fa.gz',
      header: '>gi|194246386|ref|NC_009148.2| Equus caballus breed thoroughbred chromosome 5, EquCab2.0, whole genome shotgun sequence',
      nucleotides: 99680356
    }, {
      file: 'eca_ref_EquCab2.0_chr6.fa.gz',
      header: '>gi|194246387|ref|NC_009149.2| Equus caballus breed thoroughbred chromosome 6, EquCab2.0, whole genome shotgun sequence',
      nucleotides: 84719076
    }, {
      file: 'eca_ref_EquCab2.0_chr7.fa.gz',
      header: '>gi|194246388|ref|NC_009150.2| Equus caballus breed thoroughbred chromosome 7, EquCab2.0, whole genome shotgun sequence',
      nucleotides: 98542428
    }, {
      file: 'eca_ref_EquCab2.0_chr8.fa.gz',
      header: '>gi|194246389|ref|NC_009151.2| Equus caballus breed thoroughbred chromosome 8, EquCab2.0, whole genome shotgun sequence',
      nucleotides: 94057673
    }, {
      file: 'eca_ref_EquCab2.0_chr9.fa.gz',
      header: '>gi|194246401|ref|NC_009152.2| Equus caballus breed thoroughbred chromosome 9, EquCab2.0, whole genome shotgun sequence',
      nucleotides: 83561422
    }, {
      file: 'eca_ref_EquCab2.0_chr10.fa.gz',
      header: '>gi|194246358|ref|NC_009153.2| Equus caballus breed thoroughbred chromosome 10, EquCab2.0, whole genome shotgun sequence',
      nucleotides: 83980604
    }, {
      file: 'eca_ref_EquCab2.0_chr11.fa.gz',
      header: '>gi|194246359|ref|NC_009154.2| Equus caballus breed thoroughbred chromosome 11, EquCab2.0, whole genome shotgun sequence',
      nucleotides: 61308211
    }, {
      file: 'eca_ref_EquCab2.0_chr12.fa.gz',
      header: '>gi|194246360|ref|NC_009155.2| Equus caballus breed thoroughbred chromosome 12, EquCab2.0, whole genome shotgun sequence',
      nucleotides: 33091231
    }, {
      file: 'eca_ref_EquCab2.0_chr13.fa.gz',
      header: '>gi|194246361|ref|NC_009156.2| Equus caballus breed thoroughbred chromosome 13, EquCab2.0, whole genome shotgun sequence',
      nucleotides: 42578167
    }, {
      file: 'eca_ref_EquCab2.0_chr14.fa.gz',
      header: '>gi|194246362|ref|NC_009157.2| Equus caballus breed thoroughbred chromosome 14, EquCab2.0, whole genome shotgun sequence',
      nucleotides: 93904894
    }, {
      file: 'eca_ref_EquCab2.0_chr15.fa.gz',
      header: '>gi|194246363|ref|NC_009158.2| Equus caballus breed thoroughbred chromosome 15, EquCab2.0, whole genome shotgun sequence',
      nucleotides: 91571448
    }, {
      file: 'eca_ref_EquCab2.0_chr16.fa.gz',
      header: '>gi|194246364|ref|NC_009159.2| Equus caballus breed thoroughbred chromosome 16, EquCab2.0, whole genome shotgun sequence',
      nucleotides: 87365405
    }, {
      file: 'eca_ref_EquCab2.0_chr17.fa.gz',
      header: '>gi|194246365|ref|NC_009160.2| Equus caballus breed thoroughbred chromosome 17, EquCab2.0, whole genome shotgun sequence',
      nucleotides: 80757907
    }, {
      file: 'eca_ref_EquCab2.0_chr18.fa.gz',
      header: '>gi|194246366|ref|NC_009161.2| Equus caballus breed thoroughbred chromosome 18, EquCab2.0, whole genome shotgun sequence',
      nucleotides: 82527541
    }, {
      file: 'eca_ref_EquCab2.0_chr19.fa.gz',
      header: '>gi|194246370|ref|NC_009162.2| Equus caballus breed thoroughbred chromosome 19, EquCab2.0, whole genome shotgun sequence',
      nucleotides: 59975221
    }, {
      file: 'eca_ref_EquCab2.0_chr20.fa.gz',
      header: '>gi|194246372|ref|NC_009163.2| Equus caballus breed thoroughbred chromosome 20, EquCab2.0, whole genome shotgun sequence',
      nucleotides: 64166202
    }, {
      file: 'eca_ref_EquCab2.0_chr21.fa.gz',
      header: '>gi|194246373|ref|NC_009164.2| Equus caballus breed thoroughbred chromosome 21, EquCab2.0, whole genome shotgun sequence',
      nucleotides: 57723302
    }, {
      file: 'eca_ref_EquCab2.0_chr22.fa.gz',
      header: '>gi|194246374|ref|NC_009165.2| Equus caballus breed thoroughbred chromosome 22, EquCab2.0, whole genome shotgun sequence',
      nucleotides: 49946797
    }, {
      file: 'eca_ref_EquCab2.0_chr23.fa.gz',
      header: '>gi|194246375|ref|NC_009166.2| Equus caballus breed thoroughbred chromosome 23, EquCab2.0, whole genome shotgun sequence',
      nucleotides: 55726280
    }, {
      file: 'eca_ref_EquCab2.0_chr24.fa.gz',
      header: '>gi|194246376|ref|NC_009167.2| Equus caballus breed thoroughbred chromosome 24, EquCab2.0, whole genome shotgun sequence',
      nucleotides: 46749900
    }, {
      file: 'eca_ref_EquCab2.0_chr25.fa.gz',
      header: '>gi|194246377|ref|NC_009168.2| Equus caballus breed thoroughbred chromosome 25, EquCab2.0, whole genome shotgun sequence',
      nucleotides: 39536964
    }, {
      file: 'eca_ref_EquCab2.0_chr26.fa.gz',
      header: '>gi|194246378|ref|NC_009169.2| Equus caballus breed thoroughbred chromosome 26, EquCab2.0, whole genome shotgun sequence',
      nucleotides: 41866177
    }, {
      file: 'eca_ref_EquCab2.0_chr27.fa.gz',
      header: '>gi|194246379|ref|NC_009170.2| Equus caballus breed thoroughbred chromosome 27, EquCab2.0, whole genome shotgun sequence',
      nucleotides: 39960074
    }, {
      file: 'eca_ref_EquCab2.0_chr28.fa.gz',
      header: '>gi|194246380|ref|NC_009171.2| Equus caballus breed thoroughbred chromosome 28, EquCab2.0, whole genome shotgun sequence',
      nucleotides: 46177339
    }, {
      file: 'eca_ref_EquCab2.0_chr29.fa.gz',
      header: '>gi|194246381|ref|NC_009172.2| Equus caballus breed thoroughbred chromosome 29, EquCab2.0, whole genome shotgun sequence',
      nucleotides: 33672925
    }, {
      file: 'eca_ref_EquCab2.0_chr30.fa.gz',
      header: '>gi|194246383|ref|NC_009173.2| Equus caballus breed thoroughbred chromosome 30, EquCab2.0, whole genome shotgun sequence',
      nucleotides: 30062385
    }, {
      file: 'eca_ref_EquCab2.0_chr31.fa.gz',
      header: '>gi|194246384|ref|NC_009174.2| Equus caballus breed thoroughbred chromosome 31, EquCab2.0, whole genome shotgun sequence',
      nucleotides: 24984650
    }, {
      file: 'eca_ref_EquCab2.0_chrX.fa.gz',
      header: '>gi|194246402|ref|NC_009175.2| Equus caballus breed thoroughbred chromosome X, EquCab2.0, whole genome shotgun sequence',
      nucleotides: 124114077
    }, {
      file: 'eca_ref_EquCab2.0_chrMT.fa.gz',
      header: '>gi|5835107|ref|NC_001640.1| Equus caballus mitochondrion, complete genome',
      nucleotides: 16660
    }]
  }, {
    taxid: 9615,
    name: 'Canis lupus familiaris (dog)',
    ncbiBuild: 3,
    version: 1,
    releaseDate: '13 January 2012',
    nucleotides: 2327650711,
    files: [{
      file: 'cfa_ref_CanFam3.1_chr1.fa.gz',
      header: '>gi|357579630|ref|NC_006583.3| Canis lupus familiaris chromosome 1, CanFam3.1, whole genome shotgun sequence',
      nucleotides: 122678785
    }, {
      file: 'cfa_ref_CanFam3.1_chr2.fa.gz',
      header: '>gi|357579629|ref|NC_006584.3| Canis lupus familiaris chromosome 2, CanFam3.1, whole genome shotgun sequence',
      nucleotides: 85426708
    }, {
      file: 'cfa_ref_CanFam3.1_chr3.fa.gz',
      header: '>gi|357579628|ref|NC_006585.3| Canis lupus familiaris chromosome 3, CanFam3.1, whole genome shotgun sequence',
      nucleotides: 91889043
    }, {
      file: 'cfa_ref_CanFam3.1_chr4.fa.gz',
      header: '>gi|357579627|ref|NC_006586.3| Canis lupus familiaris chromosome 4, CanFam3.1, whole genome shotgun sequence',
      nucleotides: 88276631
    }, {
      file: 'cfa_ref_CanFam3.1_chr5.fa.gz',
      header: '>gi|357579626|ref|NC_006587.3| Canis lupus familiaris chromosome 5, CanFam3.1, whole genome shotgun sequence',
      nucleotides: 88915250
    }, {
      file: 'cfa_ref_CanFam3.1_chr6.fa.gz',
      header: '>gi|357579625|ref|NC_006588.3| Canis lupus familiaris chromosome 6, CanFam3.1, whole genome shotgun sequence',
      nucleotides: 77573801
    }, {
      file: 'cfa_ref_CanFam3.1_chr7.fa.gz',
      header: '>gi|357579624|ref|NC_006589.3| Canis lupus familiaris chromosome 7, CanFam3.1, whole genome shotgun sequence',
      nucleotides: 80974532
    }, {
      file: 'cfa_ref_CanFam3.1_chr8.fa.gz',
      header: '>gi|357579623|ref|NC_006590.3| Canis lupus familiaris chromosome 8, CanFam3.1, whole genome shotgun sequence',
      nucleotides: 74330416
    }, {
      file: 'cfa_ref_CanFam3.1_chr9.fa.gz',
      header: '>gi|357579622|ref|NC_006591.3| Canis lupus familiaris chromosome 9, CanFam3.1, whole genome shotgun sequence',
      nucleotides: 61074082
    }, {
      file: 'cfa_ref_CanFam3.1_chr10.fa.gz',
      header: '>gi|357579621|ref|NC_006592.3| Canis lupus familiaris chromosome 10, CanFam3.1, whole genome shotgun sequence',
      nucleotides: 69331447
    }, {
      file: 'cfa_ref_CanFam3.1_chr11.fa.gz',
      header: '>gi|357579620|ref|NC_006593.3| Canis lupus familiaris chromosome 11, CanFam3.1, whole genome shotgun sequence',
      nucleotides: 74389097
    }, {
      file: 'cfa_ref_CanFam3.1_chr12.fa.gz',
      header: '>gi|357579619|ref|NC_006594.3| Canis lupus familiaris chromosome 12, CanFam3.1, whole genome shotgun sequence',
      nucleotides: 72498081
    }, {
      file: 'cfa_ref_CanFam3.1_chr13.fa.gz',
      header: '>gi|357579618|ref|NC_006595.3| Canis lupus familiaris chromosome 13, CanFam3.1, whole genome shotgun sequence',
      nucleotides: 63241923
    }, {
      file: 'cfa_ref_CanFam3.1_chr14.fa.gz',
      header: '>gi|357579617|ref|NC_006596.3| Canis lupus familiaris chromosome 14, CanFam3.1, whole genome shotgun sequence',
      nucleotides: 60966679
    }, {
      file: 'cfa_ref_CanFam3.1_chr15.fa.gz',
      header: '>gi|357579616|ref|NC_006597.3| Canis lupus familiaris chromosome 15, CanFam3.1, whole genome shotgun sequence',
      nucleotides: 64190966
    }, {
      file: 'cfa_ref_CanFam3.1_chr16.fa.gz',
      header: '>gi|357579615|ref|NC_006598.3| Canis lupus familiaris chromosome 16, CanFam3.1, whole genome shotgun sequence',
      nucleotides: 59632846
    }, {
      file: 'cfa_ref_CanFam3.1_chr17.fa.gz',
      header: '>gi|357579614|ref|NC_006599.3| Canis lupus familiaris chromosome 17, CanFam3.1, whole genome shotgun sequence',
      nucleotides: 64289059
    }, {
      file: 'cfa_ref_CanFam3.1_chr18.fa.gz',
      header: '>gi|357579613|ref|NC_006600.3| Canis lupus familiaris chromosome 18, CanFam3.1, whole genome shotgun sequence',
      nucleotides: 55844845
    }, {
      file: 'cfa_ref_CanFam3.1_chr19.fa.gz',
      header: '>gi|357579612|ref|NC_006601.3| Canis lupus familiaris chromosome 19, CanFam3.1, whole genome shotgun sequence',
      nucleotides: 53741614
    }, {
      file: 'cfa_ref_CanFam3.1_chr20.fa.gz',
      header: '>gi|357579611|ref|NC_006602.3| Canis lupus familiaris chromosome 20, CanFam3.1, whole genome shotgun sequence',
      nucleotides: 58134056
    }, {
      file: 'cfa_ref_CanFam3.1_chr21.fa.gz',
      header: '>gi|357579610|ref|NC_006603.3| Canis lupus familiaris chromosome 21, CanFam3.1, whole genome shotgun sequence',
      nucleotides: 50858623
    }, {
      file: 'cfa_ref_CanFam3.1_chr22.fa.gz',
      header: '>gi|357579609|ref|NC_006604.3| Canis lupus familiaris chromosome 22, CanFam3.1, whole genome shotgun sequence',
      nucleotides: 61439934
    }, {
      file: 'cfa_ref_CanFam3.1_chr23.fa.gz',
      header: '>gi|357579608|ref|NC_006605.3| Canis lupus familiaris chromosome 23, CanFam3.1, whole genome shotgun sequence',
      nucleotides: 52294480
    }, {
      file: 'cfa_ref_CanFam3.1_chr24.fa.gz',
      header: '>gi|357579607|ref|NC_006606.3| Canis lupus familiaris chromosome 24, CanFam3.1, whole genome shotgun sequence',
      nucleotides: 47698779
    }, {
      file: 'cfa_ref_CanFam3.1_chr25.fa.gz',
      header: '>gi|357579606|ref|NC_006607.3| Canis lupus familiaris chromosome 25, CanFam3.1, whole genome shotgun sequence',
      nucleotides: 51628933
    }, {
      file: 'cfa_ref_CanFam3.1_chr26.fa.gz',
      header: '>gi|357579605|ref|NC_006608.3| Canis lupus familiaris chromosome 26, CanFam3.1, whole genome shotgun sequence',
      nucleotides: 38964690
    }, {
      file: 'cfa_ref_CanFam3.1_chr27.fa.gz',
      header: '>gi|357579604|ref|NC_006609.3| Canis lupus familiaris chromosome 27, CanFam3.1, whole genome shotgun sequence',
      nucleotides: 45876710
    }, {
      file: 'cfa_ref_CanFam3.1_chr28.fa.gz',
      header: '>gi|357579603|ref|NC_006610.3| Canis lupus familiaris chromosome 28, CanFam3.1, whole genome shotgun sequence',
      nucleotides: 41182112
    }, {
      file: 'cfa_ref_CanFam3.1_chr29.fa.gz',
      header: '>gi|357579602|ref|NC_006611.3| Canis lupus familiaris chromosome 29, CanFam3.1, whole genome shotgun sequence',
      nucleotides: 41845238
    }, {
      file: 'cfa_ref_CanFam3.1_chr30.fa.gz',
      header: '>gi|357579601|ref|NC_006612.3| Canis lupus familiaris chromosome 30, CanFam3.1, whole genome shotgun sequence',
      nucleotides: 40214260
    }, {
      file: 'cfa_ref_CanFam3.1_chr31.fa.gz',
      header: '>gi|357579600|ref|NC_006613.3| Canis lupus familiaris chromosome 31, CanFam3.1, whole genome shotgun sequence',
      nucleotides: 39895921
    }, {
      file: 'cfa_ref_CanFam3.1_chr32.fa.gz',
      header: '>gi|357579599|ref|NC_006614.3| Canis lupus familiaris chromosome 32, CanFam3.1, whole genome shotgun sequence',
      nucleotides: 38810281
    }, {
      file: 'cfa_ref_CanFam3.1_chr33.fa.gz',
      header: '>gi|357579598|ref|NC_006615.3| Canis lupus familiaris chromosome 33, CanFam3.1, whole genome shotgun sequence',
      nucleotides: 31377067
    }, {
      file: 'cfa_ref_CanFam3.1_chr34.fa.gz',
      header: '>gi|357579597|ref|NC_006616.3| Canis lupus familiaris chromosome 34, CanFam3.1, whole genome shotgun sequence',
      nucleotides: 42124431
    }, {
      file: 'cfa_ref_CanFam3.1_chr35.fa.gz',
      header: '>gi|357579596|ref|NC_006617.3| Canis lupus familiaris chromosome 35, CanFam3.1, whole genome shotgun sequence',
      nucleotides: 26524999
    }, {
      file: 'cfa_ref_CanFam3.1_chr36.fa.gz',
      header: '>gi|357579595|ref|NC_006618.3| Canis lupus familiaris chromosome 36, CanFam3.1, whole genome shotgun sequence',
      nucleotides: 30810995
    }, {
      file: 'cfa_ref_CanFam3.1_chr37.fa.gz',
      header: '>gi|357579594|ref|NC_006619.3| Canis lupus familiaris chromosome 37, CanFam3.1, whole genome shotgun sequence',
      nucleotides: 30902991
    }, {
      file: 'cfa_ref_CanFam3.1_chr38.fa.gz',
      header: '>gi|357579593|ref|NC_006620.3| Canis lupus familiaris chromosome 38, CanFam3.1, whole genome shotgun sequence',
      nucleotides: 23914537
    }, {
      file: 'cfa_ref_CanFam3.1_chrX.fa.gz',
      header: '>gi|357579592|ref|NC_006621.3| Canis lupus familiaris chromosome X, CanFam3.1, whole genome shotgun sequence',
      nucleotides: 123869142
    }, {
      file: 'cfa_ref_CanFam3.1_chrMT.fa.gz',
      header: '>gi|17737322|ref|NC_002008.4| Canis lupus familiaris mitochondrion, complete genome',
      nucleotides: 16727
    }]
  }, {
    taxid: 9986,
    name: 'Oryctolagus cuniculus (rabbit)',
    ncbiBuild: 1,
    version: 1,
    releaseDate: '1 September 2010',
    nucleotides: 2247769349,
    files: [{
      file: 'ocu_ref_OryCun2.0_chr1.fa.gz',
      header: '>gi|283562148|ref|NC_013669.1| Oryctolagus cuniculus breed Thorbecke inbred chromosome 1, OryCun2.0, whole genome shotgun sequence',
      nucleotides: 194850757
    }, {
      file: 'ocu_ref_OryCun2.0_chr2.fa.gz',
      header: '>gi|283562147|ref|NC_013670.1| Oryctolagus cuniculus breed Thorbecke inbred chromosome 2, OryCun2.0, whole genome shotgun sequence',
      nucleotides: 174332312
    }, {
      file: 'ocu_ref_OryCun2.0_chr3.fa.gz',
      header: '>gi|283562146|ref|NC_013671.1| Oryctolagus cuniculus breed Thorbecke inbred chromosome 3, OryCun2.0, whole genome shotgun sequence',
      nucleotides: 155691105
    }, {
      file: 'ocu_ref_OryCun2.0_chr4.fa.gz',
      header: '>gi|283562145|ref|NC_013672.1| Oryctolagus cuniculus breed Thorbecke inbred chromosome 4, OryCun2.0, whole genome shotgun sequence',
      nucleotides: 91394100
    }, {
      file: 'ocu_ref_OryCun2.0_chr5.fa.gz',
      header: '>gi|283562144|ref|NC_013673.1| Oryctolagus cuniculus breed Thorbecke inbred chromosome 5, OryCun2.0, whole genome shotgun sequence',
      nucleotides: 37992211
    }, {
      file: 'ocu_ref_OryCun2.0_chr6.fa.gz',
      header: '>gi|283562143|ref|NC_013674.1| Oryctolagus cuniculus breed Thorbecke inbred chromosome 6, OryCun2.0, whole genome shotgun sequence',
      nucleotides: 27502587
    }, {
      file: 'ocu_ref_OryCun2.0_chr7.fa.gz',
      header: '>gi|283562142|ref|NC_013675.1| Oryctolagus cuniculus breed Thorbecke inbred chromosome 7, OryCun2.0, whole genome shotgun sequence',
      nucleotides: 173684459
    }, {
      file: 'ocu_ref_OryCun2.0_chr8.fa.gz',
      header: '>gi|283562141|ref|NC_013676.1| Oryctolagus cuniculus breed Thorbecke inbred chromosome 8, OryCun2.0, whole genome shotgun sequence',
      nucleotides: 111795807
    }, {
      file: 'ocu_ref_OryCun2.0_chr9.fa.gz',
      header: '>gi|283562140|ref|NC_013677.1| Oryctolagus cuniculus breed Thorbecke inbred chromosome 9, OryCun2.0, whole genome shotgun sequence',
      nucleotides: 116251907
    }, {
      file: 'ocu_ref_OryCun2.0_chr10.fa.gz',
      header: '>gi|283562139|ref|NC_013678.1| Oryctolagus cuniculus breed Thorbecke inbred chromosome 10, OryCun2.0, whole genome shotgun sequence',
      nucleotides: 47997241
    }, {
      file: 'ocu_ref_OryCun2.0_chr11.fa.gz',
      header: '>gi|283562138|ref|NC_013679.1| Oryctolagus cuniculus breed Thorbecke inbred chromosome 11, OryCun2.0, whole genome shotgun sequence',
      nucleotides: 87554214
    }, {
      file: 'ocu_ref_OryCun2.0_chr12.fa.gz',
      header: '>gi|283562137|ref|NC_013680.1| Oryctolagus cuniculus breed Thorbecke inbred chromosome 12, OryCun2.0, whole genome shotgun sequence',
      nucleotides: 155355395
    }, {
      file: 'ocu_ref_OryCun2.0_chr13.fa.gz',
      header: '>gi|283562136|ref|NC_013681.1| Oryctolagus cuniculus breed Thorbecke inbred chromosome 13, OryCun2.0, whole genome shotgun sequence',
      nucleotides: 143360832
    }, {
      file: 'ocu_ref_OryCun2.0_chr14.fa.gz',
      header: '>gi|283562135|ref|NC_013682.1| Oryctolagus cuniculus breed Thorbecke inbred chromosome 14, OryCun2.0, whole genome shotgun sequence',
      nucleotides: 163896628
    }, {
      file: 'ocu_ref_OryCun2.0_chr15.fa.gz',
      header: '>gi|283562134|ref|NC_013683.1| Oryctolagus cuniculus breed Thorbecke inbred chromosome 15, OryCun2.0, whole genome shotgun sequence',
      nucleotides: 109054052
    }, {
      file: 'ocu_ref_OryCun2.0_chr16.fa.gz',
      header: '>gi|283562133|ref|NC_013684.1| Oryctolagus cuniculus breed Thorbecke inbred chromosome 16, OryCun2.0, whole genome shotgun sequence',
      nucleotides: 84478945
    }, {
      file: 'ocu_ref_OryCun2.0_chr17.fa.gz',
      header: '>gi|283562132|ref|NC_013685.1| Oryctolagus cuniculus breed Thorbecke inbred chromosome 17, OryCun2.0, whole genome shotgun sequence',
      nucleotides: 85008467
    }, {
      file: 'ocu_ref_OryCun2.0_chr18.fa.gz',
      header: '>gi|283562131|ref|NC_013686.1| Oryctolagus cuniculus breed Thorbecke inbred chromosome 18, OryCun2.0, whole genome shotgun sequence',
      nucleotides: 69800736
    }, {
      file: 'ocu_ref_OryCun2.0_chr19.fa.gz',
      header: '>gi|283562130|ref|NC_013687.1| Oryctolagus cuniculus breed Thorbecke inbred chromosome 19, OryCun2.0, whole genome shotgun sequence',
      nucleotides: 57279966
    }, {
      file: 'ocu_ref_OryCun2.0_chr20.fa.gz',
      header: '>gi|283562129|ref|NC_013688.1| Oryctolagus cuniculus breed Thorbecke inbred chromosome 20, OryCun2.0, whole genome shotgun sequence',
      nucleotides: 33191332
    }, {
      file: 'ocu_ref_OryCun2.0_chr21.fa.gz',
      header: '>gi|283562128|ref|NC_013689.1| Oryctolagus cuniculus breed Thorbecke inbred chromosome 21, OryCun2.0, whole genome shotgun sequence',
      nucleotides: 15578276
    }, {
      file: 'ocu_ref_OryCun2.0_chrX.fa.gz',
      header: '>gi|283562127|ref|NC_013690.1| Oryctolagus cuniculus breed Thorbecke inbred chromosome X, OryCun2.0, whole genome shotgun sequence',
      nucleotides: 111700775
    }, {
      file: 'ocu_chrMT.fa.gz',
      header: '>gi|5835526|ref|NC_001913.1| Oryctolagus cuniculus mitochondrion, complete genome',
      nucleotides: 17245
    }]
  }, {
    taxid: 7955,
    name: 'Danio rerio (zebrafish)',
    ncbiBuild: 5,
    version: 1,
    releaseDate: '17 May 2011',
    nucleotides: 1357051643,
    files: [{
      file: 'dr_ref_Zv9_chr1.fa.gz',
      header: '>gi|312144729|ref|NC_007112.5| Danio rerio strain Tuebingen chromosome 1, Zv9',
      nucleotides: 60348388
    }, {
      file: 'dr_ref_Zv9_chr2.fa.gz',
      header: '>gi|312144728|ref|NC_007113.5| Danio rerio strain Tuebingen chromosome 2, Zv9',
      nucleotides: 60300536
    }, {
      file: 'dr_ref_Zv9_chr3.fa.gz',
      header: '>gi|312144727|ref|NC_007114.5| Danio rerio strain Tuebingen chromosome 3, Zv9',
      nucleotides: 63268876
    }, {
      file: 'dr_ref_Zv9_chr4.fa.gz',
      header: '>gi|312144726|ref|NC_007115.5| Danio rerio strain Tuebingen chromosome 4, Zv9',
      nucleotides: 62094675
    }, {
      file: 'dr_ref_Zv9_chr5.fa.gz',
      header: '>gi|312144725|ref|NC_007116.5| Danio rerio strain Tuebingen chromosome 5, Zv9',
      nucleotides: 75682077
    }, {
      file: 'dr_ref_Zv9_chr6.fa.gz',
      header: '>gi|312144724|ref|NC_007117.5| Danio rerio strain Tuebingen chromosome 6, Zv9',
      nucleotides: 59938731
    }, {
      file: 'dr_ref_Zv9_chr7.fa.gz',
      header: '>gi|312144723|ref|NC_007118.5| Danio rerio strain Tuebingen chromosome 7, Zv9',
      nucleotides: 77276063
    }, {
      file: 'dr_ref_Zv9_chr8.fa.gz',
      header: '>gi|312144722|ref|NC_007119.5| Danio rerio strain Tuebingen chromosome 8, Zv9',
      nucleotides: 56184765
    }, {
      file: 'dr_ref_Zv9_chr9.fa.gz',
      header: '>gi|312144721|ref|NC_007120.5| Danio rerio strain Tuebingen chromosome 9, Zv9',
      nucleotides: 58232459
    }, {
      file: 'dr_ref_Zv9_chr10.fa.gz',
      header: '>gi|312144720|ref|NC_007121.5| Danio rerio strain Tuebingen chromosome 10, Zv9',
      nucleotides: 46591166
    }, {
      file: 'dr_ref_Zv9_chr11.fa.gz',
      header: '>gi|312144719|ref|NC_007122.5| Danio rerio strain Tuebingen chromosome 11, Zv9',
      nucleotides: 46661319
    }, {
      file: 'dr_ref_Zv9_chr12.fa.gz',
      header: '>gi|312144718|ref|NC_007123.5| Danio rerio strain Tuebingen chromosome 12, Zv9',
      nucleotides: 50697278
    }, {
      file: 'dr_ref_Zv9_chr13.fa.gz',
      header: '>gi|312144717|ref|NC_007124.5| Danio rerio strain Tuebingen chromosome 13, Zv9',
      nucleotides: 54093808
    }, {
      file: 'dr_ref_Zv9_chr14.fa.gz',
      header: '>gi|312144716|ref|NC_007125.5| Danio rerio strain Tuebingen chromosome 14, Zv9',
      nucleotides: 53733891
    }, {
      file: 'dr_ref_Zv9_chr15.fa.gz',
      header: '>gi|312144715|ref|NC_007126.5| Danio rerio strain Tuebingen chromosome 15, Zv9',
      nucleotides: 47442429
    }, {
      file: 'dr_ref_Zv9_chr16.fa.gz',
      header: '>gi|312144714|ref|NC_007127.5| Danio rerio strain Tuebingen chromosome 16, Zv9',
      nucleotides: 58780683
    }, {
      file: 'dr_ref_Zv9_chr17.fa.gz',
      header: '>gi|312144713|ref|NC_007128.5| Danio rerio strain Tuebingen chromosome 17, Zv9',
      nucleotides: 53984731
    }, {
      file: 'dr_ref_Zv9_chr18.fa.gz',
      header: '>gi|312144712|ref|NC_007129.5| Danio rerio strain Tuebingen chromosome 18, Zv9',
      nucleotides: 49877488
    }, {
      file: 'dr_ref_Zv9_chr19.fa.gz',
      header: '>gi|312144711|ref|NC_007130.5| Danio rerio strain Tuebingen chromosome 19, Zv9',
      nucleotides: 50254551
    }, {
      file: 'dr_ref_Zv9_chr20.fa.gz',
      header: '>gi|312144710|ref|NC_007131.5| Danio rerio strain Tuebingen chromosome 20, Zv9',
      nucleotides: 55952140
    }, {
      file: 'dr_ref_Zv9_chr21.fa.gz',
      header: '>gi|312144709|ref|NC_007132.5| Danio rerio strain Tuebingen chromosome 21, Zv9',
      nucleotides: 44544065
    }, {
      file: 'dr_ref_Zv9_chr22.fa.gz',
      header: '>gi|312144708|ref|NC_007133.5| Danio rerio strain Tuebingen chromosome 22, Zv9',
      nucleotides: 42261000
    }, {
      file: 'dr_ref_Zv9_chr23.fa.gz',
      header: '>gi|312144707|ref|NC_007134.5| Danio rerio strain Tuebingen chromosome 23, Zv9',
      nucleotides: 46386876
    }, {
      file: 'dr_ref_Zv9_chr24.fa.gz',
      header: '>gi|312144706|ref|NC_007135.5| Danio rerio strain Tuebingen chromosome 24, Zv9',
      nucleotides: 43947580
    }, {
      file: 'dr_ref_Zv9_chr25.fa.gz',
      header: '>gi|312144705|ref|NC_007136.5| Danio rerio strain Tuebingen chromosome 25, Zv9',
      nucleotides: 38499472
    }, {
      file: 'dr_ref_Zv9_chrMT.fa.gz',
      header: '>gi|15079186|ref|NC_002333.2| Danio rerio mitochondrion, complete genome',
      nucleotides: 16596
    }]
  }, {
    taxid: 28377,
    name: 'Anolis carolinensis (green anole)',
    ncbiBuild: 1,
    version: 1,
    releaseDate: '17 May 2011',
    nucleotides: 1081661814,
    files: [{
      file: 'acr_ref_AnoCar2.0_chr1.fa.gz',
      header: '>gi|315422585|ref|NC_014776.1| Anolis carolinensis chromosome 1, AnoCar2.0, whole genome shotgun sequence',
      nucleotides: 263920458
    }, {
      file: 'acr_ref_AnoCar2.0_chr2.fa.gz',
      header: '>gi|315422584|ref|NC_014777.1| Anolis carolinensis chromosome 2, AnoCar2.0, whole genome shotgun sequence',
      nucleotides: 199619895
    }, {
      file: 'acr_ref_AnoCar2.0_chr3.fa.gz',
      header: '>gi|315422583|ref|NC_014778.1| Anolis carolinensis chromosome 3, AnoCar2.0, whole genome shotgun sequence',
      nucleotides: 204416410
    }, {
      file: 'acr_ref_AnoCar2.0_chr4.fa.gz',
      header: '>gi|315422582|ref|NC_014779.1| Anolis carolinensis chromosome 4, AnoCar2.0, whole genome shotgun sequence',
      nucleotides: 156502444
    }, {
      file: 'acr_ref_AnoCar2.0_chr5.fa.gz',
      header: '>gi|315422581|ref|NC_014780.1| Anolis carolinensis chromosome 5, AnoCar2.0, whole genome shotgun sequence',
      nucleotides: 150641573
    }, {
      file: 'acr_ref_AnoCar2.0_chr6.fa.gz',
      header: '>gi|315422580|ref|NC_014781.1| Anolis carolinensis chromosome 6, AnoCar2.0, whole genome shotgun sequence',
      nucleotides: 80741955
    }, {
      file: 'acr_ref_AnoCar2.0_chra.fa.gz',
      header: '>gi|315422579|ref|NC_014782.1| Anolis carolinensis linkage group a, AnoCar2.0 chromosome, whole genome shotgun sequence',
      nucleotides: 7025928
    }, {
      file: 'acr_ref_AnoCar2.0_chrb.fa.gz',
      header: '>gi|315422578|ref|NC_014783.1| Anolis carolinensis linkage group b, AnoCar2.0 chromosome, whole genome shotgun sequence',
      nucleotides: 3271537
    }, {
      file: 'acr_ref_AnoCar2.0_chrc.fa.gz',
      header: '>gi|315422577|ref|NC_014784.1| Anolis carolinensis linkage group c, AnoCar2.0 chromosome, whole genome shotgun sequence',
      nucleotides: 9478905
    }, {
      file: 'acr_ref_AnoCar2.0_chrd.fa.gz',
      header: '>gi|315422576|ref|NC_014785.1| Anolis carolinensis linkage group d, AnoCar2.0 chromosome, whole genome shotgun sequence',
      nucleotides: 1094478
    }, {
      file: 'acr_ref_AnoCar2.0_chrf.fa.gz',
      header: '>gi|315422575|ref|NC_014786.1| Anolis carolinensis linkage group f, AnoCar2.0 chromosome, whole genome shotgun sequence',
      nucleotides: 4257874
    }, {
      file: 'acr_ref_AnoCar2.0_chrg.fa.gz',
      header: '>gi|315422574|ref|NC_014787.1| Anolis carolinensis linkage group g, AnoCar2.0 chromosome, whole genome shotgun sequence',
      nucleotides: 424765
    }, {
      file: 'acr_ref_AnoCar2.0_chrh.fa.gz',
      header: '>gi|315422573|ref|NC_014788.1| Anolis carolinensis linkage group h, AnoCar2.0 chromosome, whole genome shotgun sequence',
      nucleotides: 248369
    }, {
      file: 'acr_ref_AnoCar2.0_chrMT.fa.gz',
      header: '>gi|319428597|ref|NC_010972.2| Anolis carolinensis mitochondrion, complete genome',
      nucleotides: 17223
    }]
  }, {
    taxid: 9103,
    name: 'Meleagris gallopavo (turkey)',
    ncbiBuild: 1,
    version: 1,
    releaseDate: '17 May 2011',
    nucleotides: 1040303789,
    files: [{
      file: 'mga_ref_Turkey_2.01_chr1.fa.gz',
      header: '>gi|321724987|ref|NC_015011.1| Meleagris gallopavo breed Aviagen turkey brand Nicholas breeding stock chromosome 1, Turkey_2.01, whole genome shotgun sequence',
      nucleotides: 204065131
    }, {
      file: 'mga_ref_Turkey_2.01_chr2.fa.gz',
      header: '>gi|321714172|ref|NC_015012.1| Meleagris gallopavo breed Aviagen turkey brand Nicholas breeding stock chromosome 2, Turkey_2.01, whole genome shotgun sequence',
      nucleotides: 116965580
    }, {
      file: 'mga_ref_Turkey_2.01_chr3.fa.gz',
      header: '>gi|321701227|ref|NC_015013.1| Meleagris gallopavo breed Aviagen turkey brand Nicholas breeding stock chromosome 3, Turkey_2.01, whole genome shotgun sequence',
      nucleotides: 100405168
    }, {
      file: 'mga_ref_Turkey_2.01_chr4.fa.gz',
      header: '>gi|321701203|ref|NC_015014.1| Meleagris gallopavo breed Aviagen turkey brand Nicholas breeding stock chromosome 4, Turkey_2.01, whole genome shotgun sequence',
      nucleotides: 74864452
    }, {
      file: 'mga_ref_Turkey_2.01_chr5.fa.gz',
      header: '>gi|321701181|ref|NC_015015.1| Meleagris gallopavo breed Aviagen turkey brand Nicholas breeding stock chromosome 5, Turkey_2.01, whole genome shotgun sequence',
      nucleotides: 62524071
    }, {
      file: 'mga_ref_Turkey_2.01_chr6.fa.gz',
      header: '>gi|321701162|ref|NC_015016.1| Meleagris gallopavo breed Aviagen turkey brand Nicholas breeding stock chromosome 6, Turkey_2.01, whole genome shotgun sequence',
      nucleotides: 53257280
    }, {
      file: 'mga_ref_Turkey_2.01_chr7.fa.gz',
      header: '>gi|321701152|ref|NC_015017.1| Meleagris gallopavo breed Aviagen turkey brand Nicholas breeding stock chromosome 7, Turkey_2.01, whole genome shotgun sequence',
      nucleotides: 38723565
    }, {
      file: 'mga_ref_Turkey_2.01_chr8.fa.gz',
      header: '>gi|321701139|ref|NC_015018.1| Meleagris gallopavo breed Aviagen turkey brand Nicholas breeding stock chromosome 8, Turkey_2.01, whole genome shotgun sequence',
      nucleotides: 38656188
    }, {
      file: 'mga_ref_Turkey_2.01_chr9.fa.gz',
      header: '>gi|321701135|ref|NC_015019.1| Meleagris gallopavo breed Aviagen turkey brand Nicholas breeding stock chromosome 9, Turkey_2.01, whole genome shotgun sequence',
      nucleotides: 19388849
    }, {
      file: 'mga_ref_Turkey_2.01_chr10.fa.gz',
      header: '>gi|321701124|ref|NC_015020.1| Meleagris gallopavo breed Aviagen turkey brand Nicholas breeding stock chromosome 10, Turkey_2.01, whole genome shotgun sequence',
      nucleotides: 31125776
    }, {
      file: 'mga_ref_Turkey_2.01_chr11.fa.gz',
      header: '>gi|321701109|ref|NC_015021.1| Meleagris gallopavo breed Aviagen turkey brand Nicholas breeding stock chromosome 11, Turkey_2.01, whole genome shotgun sequence',
      nucleotides: 24221871
    }, {
      file: 'mga_ref_Turkey_2.01_chr12.fa.gz',
      header: '>gi|321701100|ref|NC_015022.1| Meleagris gallopavo breed Aviagen turkey brand Nicholas breeding stock chromosome 12, Turkey_2.01, whole genome shotgun sequence',
      nucleotides: 20663262
    }, {
      file: 'mga_ref_Turkey_2.01_chr13.fa.gz',
      header: '>gi|321701090|ref|NC_015023.1| Meleagris gallopavo breed Aviagen turkey brand Nicholas breeding stock chromosome 13, Turkey_2.01, whole genome shotgun sequence',
      nucleotides: 20109194
    }, {
      file: 'mga_ref_Turkey_2.01_chr14.fa.gz',
      header: '>gi|321701087|ref|NC_015024.1| Meleagris gallopavo breed Aviagen turkey brand Nicholas breeding stock chromosome 14, Turkey_2.01, whole genome shotgun sequence',
      nucleotides: 20812856
    }, {
      file: 'mga_ref_Turkey_2.01_chr15.fa.gz',
      header: '>gi|321701083|ref|NC_015025.1| Meleagris gallopavo breed Aviagen turkey brand Nicholas breeding stock chromosome 15, Turkey_2.01, whole genome shotgun sequence',
      nucleotides: 18242780
    }, {
      file: 'mga_ref_Turkey_2.01_chr16.fa.gz',
      header: '>gi|321701074|ref|NC_015026.1| Meleagris gallopavo breed Aviagen turkey brand Nicholas breeding stock chromosome 16, Turkey_2.01, whole genome shotgun sequence',
      nucleotides: 15988495
    }, {
      file: 'mga_ref_Turkey_2.01_chr17.fa.gz',
      header: '>gi|321701067|ref|NC_015027.1| Meleagris gallopavo breed Aviagen turkey brand Nicholas breeding stock chromosome 17, Turkey_2.01, whole genome shotgun sequence',
      nucleotides: 13277600
    }, {
      file: 'mga_ref_Turkey_2.01_chr18.fa.gz',
      header: '>gi|321701064|ref|NC_015028.1| Meleagris gallopavo breed Aviagen turkey brand Nicholas breeding stock chromosome 18, Turkey_2.01, whole genome shotgun sequence',
      nucleotides: 244177
    }, {
      file: 'mga_ref_Turkey_2.01_chr19.fa.gz',
      header: '>gi|321701061|ref|NC_015029.1| Meleagris gallopavo breed Aviagen turkey brand Nicholas breeding stock chromosome 19, Turkey_2.01, whole genome shotgun sequence',
      nucleotides: 10526435
    }, {
      file: 'mga_ref_Turkey_2.01_chr20.fa.gz',
      header: '>gi|321701041|ref|NC_015030.1| Meleagris gallopavo breed Aviagen turkey brand Nicholas breeding stock chromosome 20, Turkey_2.01, whole genome shotgun sequence',
      nucleotides: 11078015
    }, {
      file: 'mga_ref_Turkey_2.01_chr21.fa.gz',
      header: '>gi|321701037|ref|NC_015031.1| Meleagris gallopavo breed Aviagen turkey brand Nicholas breeding stock chromosome 21, Turkey_2.01, whole genome shotgun sequence',
      nucleotides: 10459824
    }, {
      file: 'mga_ref_Turkey_2.01_chr22.fa.gz',
      header: '>gi|321701026|ref|NC_015032.1| Meleagris gallopavo breed Aviagen turkey brand Nicholas breeding stock chromosome 22, Turkey_2.01, whole genome shotgun sequence',
      nucleotides: 14786829
    }, {
      file: 'mga_ref_Turkey_2.01_chr23.fa.gz',
      header: '>gi|321701015|ref|NC_015033.1| Meleagris gallopavo breed Aviagen turkey brand Nicholas breeding stock chromosome 23, Turkey_2.01, whole genome shotgun sequence',
      nucleotides: 7113888
    }, {
      file: 'mga_ref_Turkey_2.01_chr24.fa.gz',
      header: '>gi|321701005|ref|NC_015034.1| Meleagris gallopavo breed Aviagen turkey brand Nicholas breeding stock chromosome 24, Turkey_2.01, whole genome shotgun sequence',
      nucleotides: 4158796
    }, {
      file: 'mga_ref_Turkey_2.01_chr25.fa.gz',
      header: '>gi|321701001|ref|NC_015035.1| Meleagris gallopavo breed Aviagen turkey brand Nicholas breeding stock chromosome 25, Turkey_2.01, whole genome shotgun sequence',
      nucleotides: 5560109
    }, {
      file: 'mga_ref_Turkey_2.01_chr26.fa.gz',
      header: '>gi|321700997|ref|NC_015036.1| Meleagris gallopavo breed Aviagen turkey brand Nicholas breeding stock chromosome 26, Turkey_2.01, whole genome shotgun sequence',
      nucleotides: 6750878
    }, {
      file: 'mga_ref_Turkey_2.01_chr27.fa.gz',
      header: '>gi|321700991|ref|NC_015037.1| Meleagris gallopavo breed Aviagen turkey brand Nicholas breeding stock chromosome 27, Turkey_2.01, whole genome shotgun sequence',
      nucleotides: 943817
    }, {
      file: 'mga_ref_Turkey_2.01_chr28.fa.gz',
      header: '>gi|321700987|ref|NC_015038.1| Meleagris gallopavo breed Aviagen turkey brand Nicholas breeding stock chromosome 28, Turkey_2.01, whole genome shotgun sequence',
      nucleotides: 4894109
    }, {
      file: 'mga_ref_Turkey_2.01_chr29.fa.gz',
      header: '>gi|321700981|ref|NC_015039.1| Meleagris gallopavo breed Aviagen turkey brand Nicholas breeding stock chromosome 29, Turkey_2.01, whole genome shotgun sequence',
      nucleotides: 4826704
    }, {
      file: 'mga_ref_Turkey_2.01_chr30.fa.gz',
      header: '>gi|321700971|ref|NC_015040.1| Meleagris gallopavo breed Aviagen turkey brand Nicholas breeding stock chromosome 30, Turkey_2.01, whole genome shotgun sequence',
      nucleotides: 4396694
    }, {
      file: 'mga_ref_Turkey_2.01_chrW.fa.gz',
      header: '>gi|321694972|ref|NC_015042.1| Meleagris gallopavo breed Aviagen turkey brand Nicholas breeding stock chromosome W, Turkey_2.01, whole genome shotgun sequence',
      nucleotides: 242905
    }, {
      file: 'mga_ref_Turkey_2.01_chrZ.fa.gz',
      header: '>gi|321695360|ref|NC_015041.1| Meleagris gallopavo breed Aviagen turkey brand Nicholas breeding stock chromosome Z, Turkey_2.01, whole genome shotgun sequence',
      nucleotides: 81011772
    }, {
      file: 'mga_ref_Turkey_2.01_chrMT.fa.gz',
      header: '>gi|323690831|ref|NC_010195.2| Meleagris gallopavo mitochondrion, complete genome',
      nucleotides: 16719
    }]
  }, {
    taxid: 59729,
    name: 'Taeniopygia guttata (Zebra finch)',
    ncbiBuild: 1,
    version: 1,
    releaseDate: '5 March 2009',
    nucleotides: 1021462940,
    files: [{
      file: 'tgu_ref_chr1.fa.gz',
      header: '>gi|224381666|ref|NC_011462.1|NC_011462 Taeniopygia guttata chromosome 1, reference assembly (based on Taeniopygia_guttata-3.2.4), whole genome shotgun sequence',
      nucleotides: 118548696
    }, {
      file: 'tgu_ref_chr1A.fa.gz',
      header: '>gi|224381677|ref|NC_011463.1|NC_011463 Taeniopygia guttata chromosome 1A, reference assembly (based on Taeniopygia_guttata-3.2.4), whole genome shotgun sequence',
      nucleotides: 73657157
    }, {
      file: 'tgu_ref_chr1B.fa.gz',
      header: '>gi|224381678|ref|NC_011464.1|NC_011464 Taeniopygia guttata chromosome 1B, reference assembly (based on Taeniopygia_guttata-3.2.4), whole genome shotgun sequence',
      nucleotides: 1083483
    }, {
      file: 'tgu_ref_chr2.fa.gz',
      header: '>gi|224381679|ref|NC_011465.1|NC_011465 Taeniopygia guttata chromosome 2, reference assembly (based on Taeniopygia_guttata-3.2.4), whole genome shotgun sequence',
      nucleotides: 156412533
    }, {
      file: 'tgu_ref_chr3.fa.gz',
      header: '>gi|224381689|ref|NC_011466.1|NC_011466 Taeniopygia guttata chromosome 3, reference assembly (based on Taeniopygia_guttata-3.2.4), whole genome shotgun sequence',
      nucleotides: 112617285
    }, {
      file: 'tgu_ref_chr4.fa.gz',
      header: '>gi|224381690|ref|NC_011467.1|NC_011467 Taeniopygia guttata chromosome 4, reference assembly (based on Taeniopygia_guttata-3.2.4), whole genome shotgun sequence',
      nucleotides: 69780378
    }, {
      file: 'tgu_ref_chr4A.fa.gz',
      header: '>gi|224381691|ref|NC_011468.1|NC_011468 Taeniopygia guttata chromosome 4A, reference assembly (based on Taeniopygia_guttata-3.2.4), whole genome shotgun sequence',
      nucleotides: 20704505
    }, {
      file: 'tgu_ref_chr5.fa.gz',
      header: '>gi|224381692|ref|NC_011469.1|NC_011469 Taeniopygia guttata chromosome 5, reference assembly (based on Taeniopygia_guttata-3.2.4), whole genome shotgun sequence',
      nucleotides: 62374962
    }, {
      file: 'tgu_ref_chr6.fa.gz',
      header: '>gi|224381693|ref|NC_011470.1|NC_011470 Taeniopygia guttata chromosome 6, reference assembly (based on Taeniopygia_guttata-3.2.4), whole genome shotgun sequence',
      nucleotides: 36305782
    }, {
      file: 'tgu_ref_chr7.fa.gz',
      header: '>gi|224381694|ref|NC_011471.1|NC_011471 Taeniopygia guttata chromosome 7, reference assembly (based on Taeniopygia_guttata-3.2.4), whole genome shotgun sequence',
      nucleotides: 39844632
    }, {
      file: 'tgu_ref_chr8.fa.gz',
      header: '>gi|224381695|ref|NC_011472.1|NC_011472 Taeniopygia guttata chromosome 8, reference assembly (based on Taeniopygia_guttata-3.2.4), whole genome shotgun sequence',
      nucleotides: 27993427
    }, {
      file: 'tgu_ref_chr9.fa.gz',
      header: '>gi|224381696|ref|NC_011473.1|NC_011473 Taeniopygia guttata chromosome 9, reference assembly (based on Taeniopygia_guttata-3.2.4), whole genome shotgun sequence',
      nucleotides: 27241186
    }, {
      file: 'tgu_ref_chr10.fa.gz',
      header: '>gi|224381667|ref|NC_011474.1|NC_011474 Taeniopygia guttata chromosome 10, reference assembly (based on Taeniopygia_guttata-3.2.4), whole genome shotgun sequence',
      nucleotides: 20806668
    }, {
      file: 'tgu_ref_chr11.fa.gz',
      header: '>gi|224381668|ref|NC_011475.1|NC_011475 Taeniopygia guttata chromosome 11, reference assembly (based on Taeniopygia_guttata-3.2.4), whole genome shotgun sequence',
      nucleotides: 21403021
    }, {
      file: 'tgu_ref_chr12.fa.gz',
      header: '>gi|224381669|ref|NC_011476.1|NC_011476 Taeniopygia guttata chromosome 12, reference assembly (based on Taeniopygia_guttata-3.2.4), whole genome shotgun sequence',
      nucleotides: 21576510
    }, {
      file: 'tgu_ref_chr13.fa.gz',
      header: '>gi|224381670|ref|NC_011477.1|NC_011477 Taeniopygia guttata chromosome 13, reference assembly (based on Taeniopygia_guttata-3.2.4), whole genome shotgun sequence',
      nucleotides: 16962381
    }, {
      file: 'tgu_ref_chr14.fa.gz',
      header: '>gi|224381671|ref|NC_011478.1|NC_011478 Taeniopygia guttata chromosome 14, reference assembly (based on Taeniopygia_guttata-3.2.4), whole genome shotgun sequence',
      nucleotides: 16419078
    }, {
      file: 'tgu_ref_chr15.fa.gz',
      header: '>gi|224381672|ref|NC_011479.1|NC_011479 Taeniopygia guttata chromosome 15, reference assembly (based on Taeniopygia_guttata-3.2.4), whole genome shotgun sequence',
      nucleotides: 14428146
    }, {
      file: 'tgu_ref_chr16.fa.gz',
      header: '>gi|224381673|ref|NC_011480.1|NC_011480 Taeniopygia guttata chromosome 16, reference assembly (based on Taeniopygia_guttata-3.2.4), whole genome shotgun sequence',
      nucleotides: 9909
    }, {
      file: 'tgu_ref_chr17.fa.gz',
      header: '>gi|224381674|ref|NC_011481.1|NC_011481 Taeniopygia guttata chromosome 17, reference assembly (based on Taeniopygia_guttata-3.2.4), whole genome shotgun sequence',
      nucleotides: 11648728
    }, {
      file: 'tgu_ref_chr18.fa.gz',
      header: '>gi|224381675|ref|NC_011482.1|NC_011482 Taeniopygia guttata chromosome 18, reference assembly (based on Taeniopygia_guttata-3.2.4), whole genome shotgun sequence',
      nucleotides: 11201131
    }, {
      file: 'tgu_ref_chr19.fa.gz',
      header: '>gi|224381676|ref|NC_011483.1|NC_011483 Taeniopygia guttata chromosome 19, reference assembly (based on Taeniopygia_guttata-3.2.4), whole genome shotgun sequence',
      nucleotides: 11587733
    }, {
      file: 'tgu_ref_chr20.fa.gz',
      header: '>gi|224381680|ref|NC_011484.1|NC_011484 Taeniopygia guttata chromosome 20, reference assembly (based on Taeniopygia_guttata-3.2.4), whole genome shotgun sequence',
      nucleotides: 15652063
    }, {
      file: 'tgu_ref_chr21.fa.gz',
      header: '>gi|224381681|ref|NC_011485.1|NC_011485 Taeniopygia guttata chromosome 21, reference assembly (based on Taeniopygia_guttata-3.2.4), whole genome shotgun sequence',
      nucleotides: 5979137
    }, {
      file: 'tgu_ref_chr22.fa.gz',
      header: '>gi|224381682|ref|NC_011486.1|NC_011486 Taeniopygia guttata chromosome 22, reference assembly (based on Taeniopygia_guttata-3.2.4), whole genome shotgun sequence',
      nucleotides: 3370227
    }, {
      file: 'tgu_ref_chr23.fa.gz',
      header: '>gi|224381683|ref|NC_011487.1|NC_011487 Taeniopygia guttata chromosome 23, reference assembly (based on Taeniopygia_guttata-3.2.4), whole genome shotgun sequence',
      nucleotides: 6196912
    }, {
      file: 'tgu_ref_chr24.fa.gz',
      header: '>gi|224381684|ref|NC_011488.1|NC_011488 Taeniopygia guttata chromosome 24, reference assembly (based on Taeniopygia_guttata-3.2.4), whole genome shotgun sequence',
      nucleotides: 8021379
    }, {
      file: 'tgu_ref_chr25.fa.gz',
      header: '>gi|224381685|ref|NC_011489.1|NC_011489 Taeniopygia guttata chromosome 25, reference assembly (based on Taeniopygia_guttata-3.2.4), whole genome shotgun sequence',
      nucleotides: 1275379
    }, {
      file: 'tgu_ref_chr26.fa.gz',
      header: '>gi|224381686|ref|NC_011490.1|NC_011490 Taeniopygia guttata chromosome 26, reference assembly (based on Taeniopygia_guttata-3.2.4), whole genome shotgun sequence',
      nucleotides: 4907541
    }, {
      file: 'tgu_ref_chr27.fa.gz',
      header: '>gi|224381687|ref|NC_011491.1|NC_011491 Taeniopygia guttata chromosome 27, reference assembly (based on Taeniopygia_guttata-3.2.4), whole genome shotgun sequence',
      nucleotides: 4618897
    }, {
      file: 'tgu_ref_chr28.fa.gz',
      header: '>gi|224381688|ref|NC_011492.1|NC_011492 Taeniopygia guttata chromosome 28, reference assembly (based on Taeniopygia_guttata-3.2.4), whole genome shotgun sequence',
      nucleotides: 4963201
    }, {
      file: 'tgu_ref_chrZ.fa.gz',
      header: '>gi|224381700|ref|NC_011493.1|NC_011493 Taeniopygia guttata chromosome Z, reference assembly (based on Taeniopygia_guttata-3.2.4), whole genome shotgun sequence',
      nucleotides: 72861351
    }, {
      file: 'tgu_ref_chrLG2.fa.gz',
      header: '>gi|224381697|ref|NC_011494.1|NC_011494 Taeniopygia guttata linkage group 2, reference assembly (based on Taeniopygia_guttata-3.2.4), whole genome shotgun sequence',
      nucleotides: 109741
    }, {
      file: 'tgu_ref_chrLG5.fa.gz',
      header: '>gi|224381698|ref|NC_011495.1|NC_011495 Taeniopygia guttata linkage group 5, reference assembly (based on Taeniopygia_guttata-3.2.4), whole genome shotgun sequence',
      nucleotides: 16416
    }, {
      file: 'tgu_ref_chrLGE22.fa.gz',
      header: '>gi|224381699|ref|NC_011496.1|NC_011496 Taeniopygia guttata linkage group E22, reference assembly (based on Taeniopygia_guttata-3.2.4), whole genome shotgun sequence',
      nucleotides: 883365
    }]
  }, {
    taxid: 9031,
    name: 'Gallus gallus (chicken)',
    ncbiBuild: 3,
    version: 1,
    releaseDate: '13 January 2012',
    nucleotides: 1004818361,
    files: [{
      file: 'gga_ref_Gallus_gallus-4.0_chr1.fa.gz',
      header: '>gi|358485511|ref|NC_006088.3| Gallus gallus breed Red Jungle fowl, inbred line UCD001 chromosome 1, Gallus_gallus-4.0, whole genome shotgun sequence',
      nucleotides: 195276750
    }, {
      file: 'gga_ref_Gallus_gallus-4.0_chr2.fa.gz',
      header: '>gi|358485510|ref|NC_006089.3| Gallus gallus breed Red Jungle fowl, inbred line UCD001 chromosome 2, Gallus_gallus-4.0, whole genome shotgun sequence',
      nucleotides: 148809762
    }, {
      file: 'gga_ref_Gallus_gallus-4.0_chr3.fa.gz',
      header: '>gi|358485509|ref|NC_006090.3| Gallus gallus breed Red Jungle fowl, inbred line UCD001 chromosome 3, Gallus_gallus-4.0, whole genome shotgun sequence',
      nucleotides: 110447801
    }, {
      file: 'gga_ref_Gallus_gallus-4.0_chr4.fa.gz',
      header: '>gi|358485508|ref|NC_006091.3| Gallus gallus breed Red Jungle fowl, inbred line UCD001 chromosome 4, Gallus_gallus-4.0, whole genome shotgun sequence',
      nucleotides: 90216835
    }, {
      file: 'gga_ref_Gallus_gallus-4.0_chr5.fa.gz',
      header: '>gi|358485507|ref|NC_006092.3| Gallus gallus breed Red Jungle fowl, inbred line UCD001 chromosome 5, Gallus_gallus-4.0, whole genome shotgun sequence',
      nucleotides: 59580361
    }, {
      file: 'gga_ref_Gallus_gallus-4.0_chr6.fa.gz',
      header: '>gi|358485506|ref|NC_006093.3| Gallus gallus breed Red Jungle fowl, inbred line UCD001 chromosome 6, Gallus_gallus-4.0, whole genome shotgun sequence',
      nucleotides: 34951654
    }, {
      file: 'gga_ref_Gallus_gallus-4.0_chr7.fa.gz',
      header: '>gi|358485505|ref|NC_006094.3| Gallus gallus breed Red Jungle fowl, inbred line UCD001 chromosome 7, Gallus_gallus-4.0, whole genome shotgun sequence',
      nucleotides: 36245040
    }, {
      file: 'gga_ref_Gallus_gallus-4.0_chr8.fa.gz',
      header: '>gi|358485504|ref|NC_006095.3| Gallus gallus breed Red Jungle fowl, inbred line UCD001 chromosome 8, Gallus_gallus-4.0, whole genome shotgun sequence',
      nucleotides: 28767244
    }, {
      file: 'gga_ref_Gallus_gallus-4.0_chr9.fa.gz',
      header: '>gi|358485503|ref|NC_006096.3| Gallus gallus breed Red Jungle fowl, inbred line UCD001 chromosome 9, Gallus_gallus-4.0, whole genome shotgun sequence',
      nucleotides: 23441680
    }, {
      file: 'gga_ref_Gallus_gallus-4.0_chr10.fa.gz',
      header: '>gi|358485502|ref|NC_006097.3| Gallus gallus breed Red Jungle fowl, inbred line UCD001 chromosome 10, Gallus_gallus-4.0, whole genome shotgun sequence',
      nucleotides: 19911089
    }, {
      file: 'gga_ref_Gallus_gallus-4.0_chr11.fa.gz',
      header: '>gi|358485501|ref|NC_006098.3| Gallus gallus breed Red Jungle fowl, inbred line UCD001 chromosome 11, Gallus_gallus-4.0, whole genome shotgun sequence',
      nucleotides: 19401079
    }, {
      file: 'gga_ref_Gallus_gallus-4.0_chr12.fa.gz',
      header: '>gi|358485500|ref|NC_006099.3| Gallus gallus breed Red Jungle fowl, inbred line UCD001 chromosome 12, Gallus_gallus-4.0, whole genome shotgun sequence',
      nucleotides: 19897011
    }, {
      file: 'gga_ref_Gallus_gallus-4.0_chr13.fa.gz',
      header: '>gi|358485499|ref|NC_006100.3| Gallus gallus breed Red Jungle fowl, inbred line UCD001 chromosome 13, Gallus_gallus-4.0, whole genome shotgun sequence',
      nucleotides: 17760035
    }, {
      file: 'gga_ref_Gallus_gallus-4.0_chr14.fa.gz',
      header: '>gi|358485498|ref|NC_006101.3| Gallus gallus breed Red Jungle fowl, inbred line UCD001 chromosome 14, Gallus_gallus-4.0, whole genome shotgun sequence',
      nucleotides: 15161805
    }, {
      file: 'gga_ref_Gallus_gallus-4.0_chr15.fa.gz',
      header: '>gi|358485497|ref|NC_006102.3| Gallus gallus breed Red Jungle fowl, inbred line UCD001 chromosome 15, Gallus_gallus-4.0, whole genome shotgun sequence',
      nucleotides: 12656803
    }, {
      file: 'gga_ref_Gallus_gallus-4.0_chr16.fa.gz',
      header: '>gi|358485496|ref|NC_006103.3| Gallus gallus breed Red Jungle fowl, inbred line UCD001 chromosome 16, Gallus_gallus-4.0, whole genome shotgun sequence',
      nucleotides: 535270
    }, {
      file: 'gga_ref_Gallus_gallus-4.0_chr17.fa.gz',
      header: '>gi|358485495|ref|NC_006104.3| Gallus gallus breed Red Jungle fowl, inbred line UCD001 chromosome 17, Gallus_gallus-4.0, whole genome shotgun sequence',
      nucleotides: 10454150
    }, {
      file: 'gga_ref_Gallus_gallus-4.0_chr18.fa.gz',
      header: '>gi|358485494|ref|NC_006105.3| Gallus gallus breed Red Jungle fowl, inbred line UCD001 chromosome 18, Gallus_gallus-4.0, whole genome shotgun sequence',
      nucleotides: 11219875
    }, {
      file: 'gga_ref_Gallus_gallus-4.0_chr19.fa.gz',
      header: '>gi|358485493|ref|NC_006106.3| Gallus gallus breed Red Jungle fowl, inbred line UCD001 chromosome 19, Gallus_gallus-4.0, whole genome shotgun sequence',
      nucleotides: 9983394
    }, {
      file: 'gga_ref_Gallus_gallus-4.0_chr20.fa.gz',
      header: '>gi|358485492|ref|NC_006107.3| Gallus gallus breed Red Jungle fowl, inbred line UCD001 chromosome 20, Gallus_gallus-4.0, whole genome shotgun sequence',
      nucleotides: 14302601
    }, {
      file: 'gga_ref_Gallus_gallus-4.0_chr21.fa.gz',
      header: '>gi|358485491|ref|NC_006108.3| Gallus gallus breed Red Jungle fowl, inbred line UCD001 chromosome 21, Gallus_gallus-4.0, whole genome shotgun sequence',
      nucleotides: 6802778
    }, {
      file: 'gga_ref_Gallus_gallus-4.0_chr22.fa.gz',
      header: '>gi|358485490|ref|NC_006109.3| Gallus gallus breed Red Jungle fowl, inbred line UCD001 chromosome 22, Gallus_gallus-4.0, whole genome shotgun sequence',
      nucleotides: 4081097
    }, {
      file: 'gga_ref_Gallus_gallus-4.0_chr23.fa.gz',
      header: '>gi|358485489|ref|NC_006110.3| Gallus gallus breed Red Jungle fowl, inbred line UCD001 chromosome 23, Gallus_gallus-4.0, whole genome shotgun sequence',
      nucleotides: 5723239
    }, {
      file: 'gga_ref_Gallus_gallus-4.0_chr24.fa.gz',
      header: '>gi|358485488|ref|NC_006111.3| Gallus gallus breed Red Jungle fowl, inbred line UCD001 chromosome 24, Gallus_gallus-4.0, whole genome shotgun sequence',
      nucleotides: 6323281
    }, {
      file: 'gga_ref_Gallus_gallus-4.0_chr25.fa.gz',
      header: '>gi|358485487|ref|NC_006112.2| Gallus gallus breed Red Jungle fowl, inbred line UCD001 chromosome 25, Gallus_gallus-4.0, whole genome shotgun sequence',
      nucleotides: 2191139
    }, {
      file: 'gga_ref_Gallus_gallus-4.0_chr26.fa.gz',
      header: '>gi|358485486|ref|NC_006113.3| Gallus gallus breed Red Jungle fowl, inbred line UCD001 chromosome 26, Gallus_gallus-4.0, whole genome shotgun sequence',
      nucleotides: 5329985
    }, {
      file: 'gga_ref_Gallus_gallus-4.0_chr27.fa.gz',
      header: '>gi|358485485|ref|NC_006114.3| Gallus gallus breed Red Jungle fowl, inbred line UCD001 chromosome 27, Gallus_gallus-4.0, whole genome shotgun sequence',
      nucleotides: 5209285
    }, {
      file: 'gga_ref_Gallus_gallus-4.0_chr28.fa.gz',
      header: '>gi|358485484|ref|NC_006115.3| Gallus gallus breed Red Jungle fowl, inbred line UCD001 chromosome 28, Gallus_gallus-4.0, whole genome shotgun sequence',
      nucleotides: 4742627
    }, {
      file: 'gga_ref_Gallus_gallus-4.0_chr32.fa.gz',
      header: '>gi|118136271|ref|NC_006119.2| Gallus gallus breed Red Jungle fowl, inbred line UCD001 chromosome 32, Gallus_gallus-4.0, whole genome shotgun sequence',
      nucleotides: 1028
    }, {
      file: 'gga_ref_Gallus_gallus-4.0_chrW.fa.gz',
      header: '>gi|358485483|ref|NC_006126.3| Gallus gallus breed Red Jungle fowl, inbred line UCD001 chromosome W, Gallus_gallus-4.0, whole genome shotgun sequence',
      nucleotides: 1248174
    }, {
      file: 'gga_ref_Gallus_gallus-4.0_chrZ.fa.gz',
      header: '>gi|358485482|ref|NC_006127.3| Gallus gallus breed Red Jungle fowl, inbred line UCD001 chromosome Z, Gallus_gallus-4.0, whole genome shotgun sequence',
      nucleotides: 82363669
    }, {
      file: 'gga_ref_Gallus_gallus-4.0_chrLGE22C19W28_E50C23.fa.gz',
      header: '>gi|358485481|ref|NC_008465.2| Gallus gallus breed Red Jungle fowl, inbred line UCD001 linkage group LGE22C19W28_E50C23, Gallus_gallus-4.0 chromosome, whole genome shotgun sequence',
      nucleotides: 965146
    }, {
      file: 'gga_ref_Gallus_gallus-4.0_chrLGE64.fa.gz',
      header: '>gi|358485480|ref|NC_008466.2| Gallus gallus breed Red Jungle fowl, inbred line UCD001 linkage group LGE64, Gallus_gallus-4.0 chromosome, whole genome shotgun sequence',
      nucleotides: 799899
    }, {
      file: 'gga_ref_Gallus_gallus-4.0_chrMT.fa.gz',
      header: '>gi|5834843|ref|NC_001323.1| Gallus gallus mitochondrion, complete genome',
      nucleotides: 16775
    }]
  }, {
    taxid: 3847,
    name: 'Glycine max (soybean)',
    ncbiBuild: 1,
    version: 1,
    releaseDate: '21 December 2011',
    nucleotides: 950221025,
    files: [{
      file: 'gma_ref_V1.0_chr1.fa.gz',
      header: '>gi|353336050|ref|NC_016088.1| Glycine max chromosome 1, V1.0, whole genome shotgun sequence',
      nucleotides: 55915595
    }, {
      file: 'gma_ref_V1.0_chr2.fa.gz',
      header: '>gi|353336049|ref|NC_016089.1| Glycine max chromosome 2, V1.0, whole genome shotgun sequence',
      nucleotides: 51656713
    }, {
      file: 'gma_ref_V1.0_chr3.fa.gz',
      header: '>gi|353336048|ref|NC_016090.1| Glycine max chromosome 3, V1.0, whole genome shotgun sequence',
      nucleotides: 47781076
    }, {
      file: 'gma_ref_V1.0_chr4.fa.gz',
      header: '>gi|353336047|ref|NC_016091.1| Glycine max chromosome 4, V1.0, whole genome shotgun sequence',
      nucleotides: 49243852
    }, {
      file: 'gma_ref_V1.0_chr5.fa.gz',
      header: '>gi|353336046|ref|NC_016092.1| Glycine max chromosome 5, V1.0, whole genome shotgun sequence',
      nucleotides: 41936504
    }, {
      file: 'gma_ref_V1.0_chr6.fa.gz',
      header: '>gi|353336045|ref|NC_016093.1| Glycine max chromosome 6, V1.0, whole genome shotgun sequence',
      nucleotides: 50722821
    }, {
      file: 'gma_ref_V1.0_chr7.fa.gz',
      header: '>gi|353336044|ref|NC_016094.1| Glycine max chromosome 7, V1.0, whole genome shotgun sequence',
      nucleotides: 44683157
    }, {
      file: 'gma_ref_V1.0_chr8.fa.gz',
      header: '>gi|353336043|ref|NC_016095.1| Glycine max chromosome 8, V1.0, whole genome shotgun sequence',
      nucleotides: 46995532
    }, {
      file: 'gma_ref_V1.0_chr9.fa.gz',
      header: '>gi|353336042|ref|NC_016096.1| Glycine max chromosome 9, V1.0, whole genome shotgun sequence',
      nucleotides: 46843750
    }, {
      file: 'gma_ref_V1.0_chr10.fa.gz',
      header: '>gi|353336041|ref|NC_016097.1| Glycine max chromosome 10, V1.0, whole genome shotgun sequence',
      nucleotides: 50969635
    }, {
      file: 'gma_ref_V1.0_chr11.fa.gz',
      header: '>gi|353336040|ref|NC_016098.1| Glycine max chromosome 11, V1.0, whole genome shotgun sequence',
      nucleotides: 39172790
    }, {
      file: 'gma_ref_V1.0_chr12.fa.gz',
      header: '>gi|353336039|ref|NC_016099.1| Glycine max chromosome 12, V1.0, whole genome shotgun sequence',
      nucleotides: 40113140
    }, {
      file: 'gma_ref_V1.0_chr13.fa.gz',
      header: '>gi|353336038|ref|NC_016100.1| Glycine max chromosome 13, V1.0, whole genome shotgun sequence',
      nucleotides: 44408971
    }, {
      file: 'gma_ref_V1.0_chr14.fa.gz',
      header: '>gi|353336037|ref|NC_016101.1| Glycine max chromosome 14, V1.0, whole genome shotgun sequence',
      nucleotides: 49711204
    }, {
      file: 'gma_ref_V1.0_chr15.fa.gz',
      header: '>gi|353336036|ref|NC_016102.1| Glycine max chromosome 15, V1.0, whole genome shotgun sequence',
      nucleotides: 50939160
    }, {
      file: 'gma_ref_V1.0_chr16.fa.gz',
      header: '>gi|353336035|ref|NC_016103.1| Glycine max chromosome 16, V1.0, whole genome shotgun sequence',
      nucleotides: 37397385
    }, {
      file: 'gma_ref_V1.0_chr17.fa.gz',
      header: '>gi|353336034|ref|NC_016104.1| Glycine max chromosome 17, V1.0, whole genome shotgun sequence',
      nucleotides: 41906774
    }, {
      file: 'gma_ref_V1.0_chr18.fa.gz',
      header: '>gi|353336033|ref|NC_016105.1| Glycine max chromosome 18, V1.0, whole genome shotgun sequence',
      nucleotides: 62308140
    }, {
      file: 'gma_ref_V1.0_chr19.fa.gz',
      header: '>gi|353336032|ref|NC_016106.1| Glycine max chromosome 19, V1.0, whole genome shotgun sequence',
      nucleotides: 50589441
    }, {
      file: 'gma_ref_V1.0_chr20.fa.gz',
      header: '>gi|353336031|ref|NC_016107.1| Glycine max chromosome 20, V1.0, whole genome shotgun sequence',
      nucleotides: 46773167
    }, {
      file: 'gma_ref_V1.0_chrPltd.fa.gz',
      header: '>gi|91214122|ref|NC_007942.1| Glycine max chloroplast, complete genome',
      nucleotides: 152218
    }]
  }, {
    taxid: 9258,
    name: 'Ornithorhynchus anatinus (platypus)',
    ncbiBuild: 1,
    version: 2,
    releaseDate: '5 October 2011',
    nucleotides: 437097043,
    files: [{
      file: 'oan_ref_Ornithorhynchus_anatinus_5.0.1_chr1.fa.gz',
      header: '>gi|149712631|ref|NC_009094.1| Ornithorhynchus anatinus chromosome 1, Ornithorhynchus_anatinus-5.0.1, whole genome shotgun sequence',
      nucleotides: 47594283
    }, {
      file: 'oan_ref_Ornithorhynchus_anatinus_5.0.1_chr2.fa.gz',
      header: '>gi|149721824|ref|NC_009095.1| Ornithorhynchus anatinus chromosome 2, Ornithorhynchus_anatinus-5.0.1, whole genome shotgun sequence',
      nucleotides: 54797317
    }, {
      file: 'oan_ref_Ornithorhynchus_anatinus_5.0.1_chr3.fa.gz',
      header: '>gi|149725021|ref|NC_009096.1| Ornithorhynchus anatinus chromosome 3, Ornithorhynchus_anatinus-5.0.1, whole genome shotgun sequence',
      nucleotides: 59581953
    }, {
      file: 'oan_ref_Ornithorhynchus_anatinus_5.0.1_chr4.fa.gz',
      header: '>gi|149727112|ref|NC_009097.1| Ornithorhynchus anatinus chromosome 4, Ornithorhynchus_anatinus-5.0.1, whole genome shotgun sequence',
      nucleotides: 58987262
    }, {
      file: 'oan_ref_Ornithorhynchus_anatinus_5.0.1_chr5.fa.gz',
      header: '>gi|149728214|ref|NC_009098.1| Ornithorhynchus anatinus chromosome 5, Ornithorhynchus_anatinus-5.0.1, whole genome shotgun sequence',
      nucleotides: 24609220
    }, {
      file: 'oan_ref_Ornithorhynchus_anatinus_5.0.1_chr6.fa.gz',
      header: '>gi|149729612|ref|NC_009099.1| Ornithorhynchus anatinus chromosome 6, Ornithorhynchus_anatinus-5.0.1, whole genome shotgun sequence',
      nucleotides: 16302927
    }, {
      file: 'oan_ref_Ornithorhynchus_anatinus_5.0.1_chr7.fa.gz',
      header: '>gi|149731469|ref|NC_009100.1| Ornithorhynchus anatinus chromosome 7, Ornithorhynchus_anatinus-5.0.1, whole genome shotgun sequence',
      nucleotides: 40039088
    }, {
      file: 'oan_ref_Ornithorhynchus_anatinus_5.0.1_chr10.fa.gz',
      header: '>gi|149714148|ref|NC_009103.1| Ornithorhynchus anatinus chromosome 10, Ornithorhynchus_anatinus-5.0.1, whole genome shotgun sequence',
      nucleotides: 11243762
    }, {
      file: 'oan_ref_Ornithorhynchus_anatinus_5.0.1_chr11.fa.gz',
      header: '>gi|149715145|ref|NC_009104.1| Ornithorhynchus anatinus chromosome 11, Ornithorhynchus_anatinus-5.0.1, whole genome shotgun sequence',
      nucleotides: 6809224
    }, {
      file: 'oan_ref_Ornithorhynchus_anatinus_5.0.1_chr12.fa.gz',
      header: '>gi|149716377|ref|NC_009105.1| Ornithorhynchus anatinus chromosome 12, Ornithorhynchus_anatinus-5.0.1, whole genome shotgun sequence',
      nucleotides: 15872666
    }, {
      file: 'oan_ref_Ornithorhynchus_anatinus_5.0.1_chr14.fa.gz',
      header: '>gi|149716935|ref|NC_009107.1| Ornithorhynchus anatinus chromosome 14, Ornithorhynchus_anatinus-5.0.1, whole genome shotgun sequence',
      nucleotides: 2696122
    }, {
      file: 'oan_ref_Ornithorhynchus_anatinus_5.0.1_chr15.fa.gz',
      header: '>gi|149717714|ref|NC_009108.1| Ornithorhynchus anatinus chromosome 15, Ornithorhynchus_anatinus-5.0.1, whole genome shotgun sequence',
      nucleotides: 3786880
    }, {
      file: 'oan_ref_Ornithorhynchus_anatinus_5.0.1_chr17.fa.gz',
      header: '>gi|149717939|ref|NC_009110.1| Ornithorhynchus anatinus chromosome 17, Ornithorhynchus_anatinus-5.0.1, whole genome shotgun sequence',
      nucleotides: 1399469
    }, {
      file: 'oan_ref_Ornithorhynchus_anatinus_5.0.1_chr18.fa.gz',
      header: '>gi|149719225|ref|NC_009111.1| Ornithorhynchus anatinus chromosome 18, Ornithorhynchus_anatinus-5.0.1, whole genome shotgun sequence',
      nucleotides: 6611290
    }, {
      file: 'oan_ref_Ornithorhynchus_anatinus_5.0.1_chr20.fa.gz',
      header: '>gi|149722085|ref|NC_009112.1| Ornithorhynchus anatinus chromosome 20, Ornithorhynchus_anatinus-5.0.1, whole genome shotgun sequence',
      nucleotides: 1816412
    }, {
      file: 'oan_ref_Ornithorhynchus_anatinus_5.0.1_chrX1.fa.gz',
      header: '>gi|149737093|ref|NC_009114.1| Ornithorhynchus anatinus chromosome X1, Ornithorhynchus_anatinus-5.0.1, whole genome shotgun sequence',
      nucleotides: 45541551
    }, {
      file: 'oan_ref_Ornithorhynchus_anatinus_5.0.1_chrX2.fa.gz',
      header: '>gi|149737330|ref|NC_009115.1| Ornithorhynchus anatinus chromosome X2, Ornithorhynchus_anatinus-5.0.1, whole genome shotgun sequence',
      nucleotides: 5652501
    }, {
      file: 'oan_ref_Ornithorhynchus_anatinus_5.0.1_chrX3.fa.gz',
      header: '>gi|149737646|ref|NC_009116.1| Ornithorhynchus anatinus chromosome X3, Ornithorhynchus_anatinus-5.0.1, whole genome shotgun sequence',
      nucleotides: 5951358
    }, {
      file: 'oan_ref_Ornithorhynchus_anatinus_5.0.1_chrX5.fa.gz',
      header: '>gi|149742078|ref|NC_009118.1| Ornithorhynchus anatinus chromosome X5, Ornithorhynchus_anatinus-5.0.1, whole genome shotgun sequence',
      nucleotides: 27786739
    }, {
      file: 'oan_ref_Ornithorhynchus_anatinus_5.0.1_chrMT.fa.gz',
      header: '>gi|5836058|ref|NC_000891.1| Ornithorhynchus anatinus mitochondrion, complete genome',
      nucleotides: 17019
    }]
  }, {
    taxid: 29760,
    name: 'Vitis vinifera (wine grape)',
    ncbiBuild: 2,
    version: 1,
    releaseDate: '13 January 2012',
    nucleotides: 427110216,
    files: [{
      file: 'vvi_ref_12X_chr1.fa.gz',
      header: '>gi|357773492|ref|NC_012007.3| Vitis vinifera chromosome 1, 12X, whole genome shotgun sequence',
      nucleotides: 23037639
    }, {
      file: 'vvi_ref_12X_chr2.fa.gz',
      header: '>gi|357773491|ref|NC_012008.3| Vitis vinifera chromosome 2, 12X, whole genome shotgun sequence',
      nucleotides: 18779844
    }, {
      file: 'vvi_ref_12X_chr3.fa.gz',
      header: '>gi|357773490|ref|NC_012009.3| Vitis vinifera chromosome 3, 12X, whole genome shotgun sequence',
      nucleotides: 19341862
    }, {
      file: 'vvi_ref_12X_chr4.fa.gz',
      header: '>gi|357773489|ref|NC_012010.3| Vitis vinifera chromosome 4, 12X, whole genome shotgun sequence',
      nucleotides: 23867706
    }, {
      file: 'vvi_ref_12X_chr5.fa.gz',
      header: '>gi|357773488|ref|NC_012011.3| Vitis vinifera chromosome 5, 12X, whole genome shotgun sequence',
      nucleotides: 25021643
    }, {
      file: 'vvi_ref_12X_chr6.fa.gz',
      header: '>gi|357773487|ref|NC_012012.3| Vitis vinifera chromosome 6, 12X, whole genome shotgun sequence',
      nucleotides: 21508407
    }, {
      file: 'vvi_ref_12X_chr7.fa.gz',
      header: '>gi|357773486|ref|NC_012013.3| Vitis vinifera chromosome 7, 12X, whole genome shotgun sequence',
      nucleotides: 21026613
    }, {
      file: 'vvi_ref_12X_chr8.fa.gz',
      header: '>gi|357773485|ref|NC_012014.3| Vitis vinifera chromosome 8, 12X, whole genome shotgun sequence',
      nucleotides: 22385789
    }, {
      file: 'vvi_ref_12X_chr9.fa.gz',
      header: '>gi|357773484|ref|NC_012015.3| Vitis vinifera chromosome 9, 12X, whole genome shotgun sequence',
      nucleotides: 23006712
    }, {
      file: 'vvi_ref_12X_chr10.fa.gz',
      header: '>gi|357773483|ref|NC_012016.3| Vitis vinifera chromosome 10, 12X, whole genome shotgun sequence',
      nucleotides: 18140952
    }, {
      file: 'vvi_ref_12X_chr11.fa.gz',
      header: '>gi|357773482|ref|NC_012017.3| Vitis vinifera chromosome 11, 12X, whole genome shotgun sequence',
      nucleotides: 19818926
    }, {
      file: 'vvi_ref_12X_chr12.fa.gz',
      header: '>gi|357773481|ref|NC_012018.3| Vitis vinifera chromosome 12, 12X, whole genome shotgun sequence',
      nucleotides: 22702307
    }, {
      file: 'vvi_ref_12X_chr13.fa.gz',
      header: '>gi|357773480|ref|NC_012019.3| Vitis vinifera chromosome 13, 12X, whole genome shotgun sequence',
      nucleotides: 24396255
    }, {
      file: 'vvi_ref_12X_chr14.fa.gz',
      header: '>gi|357772479|ref|NC_012020.3| Vitis vinifera chromosome 14, 12X, whole genome shotgun sequence',
      nucleotides: 30274277
    }, {
      file: 'vvi_ref_12X_chr15.fa.gz',
      header: '>gi|357771478|ref|NC_012021.3| Vitis vinifera chromosome 15, 12X, whole genome shotgun sequence',
      nucleotides: 20304914
    }, {
      file: 'vvi_ref_12X_chr16.fa.gz',
      header: '>gi|357771477|ref|NC_012022.3| Vitis vinifera chromosome 16, 12X, whole genome shotgun sequence',
      nucleotides: 22053297
    }, {
      file: 'vvi_ref_12X_chr17.fa.gz',
      header: '>gi|357771476|ref|NC_012023.3| Vitis vinifera chromosome 17, 12X, whole genome shotgun sequence',
      nucleotides: 17126926
    }, {
      file: 'vvi_ref_12X_chr18.fa.gz',
      header: '>gi|357771475|ref|NC_012024.3| Vitis vinifera chromosome 18, 12X, whole genome shotgun sequence',
      nucleotides: 29360087
    }, {
      file: 'vvi_ref_12X_chr19.fa.gz',
      header: '>gi|357771474|ref|NC_012025.3| Vitis vinifera chromosome 19, 12X, whole genome shotgun sequence',
      nucleotides: 24021853
    }, {
      file: 'vvi_ref_12X_chrMT.fa.gz',
      header: '>gi|224365609|ref|NC_012119.1| Vitis vinifera mitochondrion, complete genome',
      nucleotides: 773279
    }, {
      file: 'vvi_ref_12X_chrPltd.fa.gz',
      header: '>gi|91983971|ref|NC_007957.1| Vitis vinifera chloroplast, complete genome',
      nucleotides: 160928
    }]
  }, {
    taxid: 15368,
    name: 'Brachypodium distachyon',
    ncbiBuild: 1,
    version: 1,
    releaseDate: '21 December 2011',
    nucleotides: 271283624,
    files: [{
      file: 'bdi_ref_v1.0_chr1.fa.gz',
      header: '>gi|353703671|ref|NC_016131.1| Brachypodium distachyon strain Bd21 chromosome 1, v1.0, whole genome shotgun sequence',
      nucleotides: 74834646
    }, {
      file: 'bdi_ref_v1.0_chr2.fa.gz',
      header: '>gi|353703670|ref|NC_016132.1| Brachypodium distachyon strain Bd21 chromosome 2, v1.0, whole genome shotgun sequence',
      nucleotides: 59328898
    }, {
      file: 'bdi_ref_v1.0_chr3.fa.gz',
      header: '>gi|353703669|ref|NC_016133.1| Brachypodium distachyon strain Bd21 chromosome 3, v1.0, whole genome shotgun sequence',
      nucleotides: 59892396
    }, {
      file: 'bdi_ref_v1.0_chr4.fa.gz',
      header: '>gi|353703668|ref|NC_016134.1| Brachypodium distachyon strain Bd21 chromosome 4, v1.0, whole genome shotgun sequence',
      nucleotides: 48648102
    }, {
      file: 'bdi_ref_v1.0_chr5.fa.gz',
      header: '>gi|353703667|ref|NC_016135.1| Brachypodium distachyon strain Bd21 chromosome 5, v1.0, whole genome shotgun sequence',
      nucleotides: 28444383
    }, {
      file: 'bdi_ref_v1.0_chrPltd.fa.gz',
      header: '>gi|194033128|ref|NC_011032.1| Brachypodium distachyon chloroplast, complete genome',
      nucleotides: 135199
    }]
  }, {
    taxid: 7460,
    name: 'Apis mellifera (honey bee)',
    ncbiBuild: 5,
    version: 1,
    releaseDate: '29 April 2011',
    nucleotides: 219645955,
    files: [{
      file: 'ame_ref_Amel_4.5_chrLG1.fa.gz',
      header: '>gi|323388987|ref|NC_007070.3| Apis mellifera strain DH4 linkage group LG1, Amel_4.5 chromosome, whole genome shotgun sequence',
      nucleotides: 29893408
    }, {
      file: 'ame_ref_Amel_4.5_chrLG2.fa.gz',
      header: '>gi|323388986|ref|NC_007071.3| Apis mellifera strain DH4 linkage group LG2, Amel_4.5 chromosome, whole genome shotgun sequence',
      nucleotides: 15549267
    }, {
      file: 'ame_ref_Amel_4.5_chrLG3.fa.gz',
      header: '>gi|323388985|ref|NC_007072.3| Apis mellifera strain DH4 linkage group LG3, Amel_4.5 chromosome, whole genome shotgun sequence',
      nucleotides: 13234341
    }, {
      file: 'ame_ref_Amel_4.5_chrLG4.fa.gz',
      header: '>gi|323388984|ref|NC_007073.3| Apis mellifera strain DH4 linkage group LG4, Amel_4.5 chromosome, whole genome shotgun sequence',
      nucleotides: 12718334
    }, {
      file: 'ame_ref_Amel_4.5_chrLG5.fa.gz',
      header: '>gi|323388983|ref|NC_007074.3| Apis mellifera strain DH4 linkage group LG5, Amel_4.5 chromosome, whole genome shotgun sequence',
      nucleotides: 14363272
    }, {
      file: 'ame_ref_Amel_4.5_chrLG6.fa.gz',
      header: '>gi|323388982|ref|NC_007075.3| Apis mellifera strain DH4 linkage group LG6, Amel_4.5 chromosome, whole genome shotgun sequence',
      nucleotides: 18472937
    }, {
      file: 'ame_ref_Amel_4.5_chrLG7.fa.gz',
      header: '>gi|323388981|ref|NC_007076.3| Apis mellifera strain DH4 linkage group LG7, Amel_4.5 chromosome, whole genome shotgun sequence',
      nucleotides: 13219345
    }, {
      file: 'ame_ref_Amel_4.5_chrLG8.fa.gz',
      header: '>gi|323388980|ref|NC_007077.3| Apis mellifera strain DH4 linkage group LG8, Amel_4.5 chromosome, whole genome shotgun sequence',
      nucleotides: 13546544
    }, {
      file: 'ame_ref_Amel_4.5_chrLG9.fa.gz',
      header: '>gi|323388979|ref|NC_007078.3| Apis mellifera strain DH4 linkage group LG9, Amel_4.5 chromosome, whole genome shotgun sequence',
      nucleotides: 11120453
    }, {
      file: 'ame_ref_Amel_4.5_chrLG10.fa.gz',
      header: '>gi|323388978|ref|NC_007079.3| Apis mellifera strain DH4 linkage group LG10, Amel_4.5 chromosome, whole genome shotgun sequence',
      nucleotides: 12965953
    }, {
      file: 'ame_ref_Amel_4.5_chrLG11.fa.gz',
      header: '>gi|323388977|ref|NC_007080.3| Apis mellifera strain DH4 linkage group LG11, Amel_4.5 chromosome, whole genome shotgun sequence',
      nucleotides: 14726556
    }, {
      file: 'ame_ref_Amel_4.5_chrLG12.fa.gz',
      header: '>gi|323388976|ref|NC_007081.3| Apis mellifera strain DH4 linkage group LG12, Amel_4.5 chromosome, whole genome shotgun sequence',
      nucleotides: 11902654
    }, {
      file: 'ame_ref_Amel_4.5_chrLG13.fa.gz',
      header: '>gi|323388975|ref|NC_007082.3| Apis mellifera strain DH4 linkage group LG13, Amel_4.5 chromosome, whole genome shotgun sequence',
      nucleotides: 10288499
    }, {
      file: 'ame_ref_Amel_4.5_chrLG14.fa.gz',
      header: '>gi|323388974|ref|NC_007083.3| Apis mellifera strain DH4 linkage group LG14, Amel_4.5 chromosome, whole genome shotgun sequence',
      nucleotides: 10253655
    }, {
      file: 'ame_ref_Amel_4.5_chrLG15.fa.gz',
      header: '>gi|323388973|ref|NC_007084.3| Apis mellifera strain DH4 linkage group LG15, Amel_4.5 chromosome, whole genome shotgun sequence',
      nucleotides: 10167229
    }, {
      file: 'ame_ref_Amel_4.5_chrLG16.fa.gz',
      header: '>gi|323388972|ref|NC_007085.3| Apis mellifera strain DH4 linkage group LG16, Amel_4.5 chromosome, whole genome shotgun sequence',
      nucleotides: 7207165
    }, {
      file: 'ame_ref_Amel_4.5_chrMT.fa.gz',
      header: '>gi|5834925|ref|NC_001566.1| Apis mellifera ligustica mitochondrion, complete genome',
      nucleotides: 16343
    }]
  }, {
    taxid: 30195,
    name: 'Bombus terrestris (buff-tailed bumblebee)',
    ncbiBuild: 1,
    version: 1,
    releaseDate: '19 August 2011',
    nucleotides: 216849342,
    files: [{
      file: 'bte_ref_Bter_1.0_chrLG_B01.fa.gz',
      header: '>gi|339751252|ref|NC_015762.1| Bombus terrestris linkage group LG B01, Bter_1.0 chromosome, whole genome shotgun sequence',
      nucleotides: 17153651
    }, {
      file: 'bte_ref_Bter_1.0_chrLG_B02.fa.gz',
      header: '>gi|339751251|ref|NC_015763.1| Bombus terrestris linkage group LG B02, Bter_1.0 chromosome, whole genome shotgun sequence',
      nucleotides: 13603873
    }, {
      file: 'bte_ref_Bter_1.0_chrLG_B03.fa.gz',
      header: '>gi|339751250|ref|NC_015764.1| Bombus terrestris linkage group LG B03, Bter_1.0 chromosome, whole genome shotgun sequence',
      nucleotides: 14656165
    }, {
      file: 'bte_ref_Bter_1.0_chrLG_B04.fa.gz',
      header: '>gi|339751249|ref|NC_015765.1| Bombus terrestris linkage group LG B04, Bter_1.0 chromosome, whole genome shotgun sequence',
      nucleotides: 14241696
    }, {
      file: 'bte_ref_Bter_1.0_chrLG_B05.fa.gz',
      header: '>gi|339751248|ref|NC_015766.1| Bombus terrestris linkage group LG B05, Bter_1.0 chromosome, whole genome shotgun sequence',
      nucleotides: 11918102
    }, {
      file: 'bte_ref_Bter_1.0_chrLG_B06.fa.gz',
      header: '>gi|339751247|ref|NC_015767.1| Bombus terrestris linkage group LG B06, Bter_1.0 chromosome, whole genome shotgun sequence',
      nucleotides: 12724418
    }, {
      file: 'bte_ref_Bter_1.0_chrLG_B07.fa.gz',
      header: '>gi|339751246|ref|NC_015768.1| Bombus terrestris linkage group LG B07, Bter_1.0 chromosome, whole genome shotgun sequence',
      nucleotides: 18145390
    }, {
      file: 'bte_ref_Bter_1.0_chrLG_B08.fa.gz',
      header: '>gi|339751245|ref|NC_015769.1| Bombus terrestris linkage group LG B08, Bter_1.0 chromosome, whole genome shotgun sequence',
      nucleotides: 9733834
    }, {
      file: 'bte_ref_Bter_1.0_chrLG_B09.fa.gz',
      header: '>gi|339751244|ref|NC_015770.1| Bombus terrestris linkage group LG B09, Bter_1.0 chromosome, whole genome shotgun sequence',
      nucleotides: 15655298
    }, {
      file: 'bte_ref_Bter_1.0_chrLG_B10.fa.gz',
      header: '>gi|339751243|ref|NC_015771.1| Bombus terrestris linkage group LG B10, Bter_1.0 chromosome, whole genome shotgun sequence',
      nucleotides: 13618662
    }, {
      file: 'bte_ref_Bter_1.0_chrLG_B11.fa.gz',
      header: '>gi|339751242|ref|NC_015772.1| Bombus terrestris linkage group LG B11, Bter_1.0 chromosome, whole genome shotgun sequence',
      nucleotides: 17228712
    }, {
      file: 'bte_ref_Bter_1.0_chrLG_B12.fa.gz',
      header: '>gi|339751241|ref|NC_015773.1| Bombus terrestris linkage group LG B12, Bter_1.0 chromosome, whole genome shotgun sequence',
      nucleotides: 12868931
    }, {
      file: 'bte_ref_Bter_1.0_chrLG_B13.fa.gz',
      header: '>gi|339751240|ref|NC_015774.1| Bombus terrestris linkage group LG B13, Bter_1.0 chromosome, whole genome shotgun sequence',
      nucleotides: 9884808
    }, {
      file: 'bte_ref_Bter_1.0_chrLG_B14.fa.gz',
      header: '>gi|339751239|ref|NC_015775.1| Bombus terrestris linkage group LG B14, Bter_1.0 chromosome, whole genome shotgun sequence',
      nucleotides: 11649563
    }, {
      file: 'bte_ref_Bter_1.0_chrLG_B15.fa.gz',
      header: '>gi|339751238|ref|NC_015776.1| Bombus terrestris linkage group LG B15, Bter_1.0 chromosome, whole genome shotgun sequence',
      nucleotides: 11467329
    }, {
      file: 'bte_ref_Bter_1.0_chrLG_B16.fa.gz',
      header: '>gi|339751237|ref|NC_015777.1| Bombus terrestris linkage group LG B16, Bter_1.0 chromosome, whole genome shotgun sequence',
      nucleotides: 5274633
    }, {
      file: 'bte_ref_Bter_1.0_chrLG_B17.fa.gz',
      header: '>gi|339751236|ref|NC_015778.1| Bombus terrestris linkage group LG B17, Bter_1.0 chromosome, whole genome shotgun sequence',
      nucleotides: 3558169
    }, {
      file: 'bte_ref_Bter_1.0_chrLG_B18.fa.gz',
      header: '>gi|339751235|ref|NC_015779.1| Bombus terrestris linkage group LG B18, Bter_1.0 chromosome, whole genome shotgun sequence',
      nucleotides: 3466108
    }]
  }, {
    taxid: 7425,
    name: 'Nasonia vitripennis (jewel wasp)',
    ncbiBuild: 2,
    version: 1,
    releaseDate: '28 September 2011',
    nucleotides: 191717756,
    files: [{
      file: 'nvi_ref_Nvit_2.0_chr1.fa.gz',
      header: '>gi|341864961|ref|NC_015867.1| Nasonia vitripennis strain AsymCX chromosome 1, Nvit_2.0, whole genome shotgun sequence',
      nucleotides: 48524378
    }, {
      file: 'nvi_ref_Nvit_2.0_chr2.fa.gz',
      header: '>gi|341864960|ref|NC_015868.1| Nasonia vitripennis strain AsymCX chromosome 2, Nvit_2.0, whole genome shotgun sequence',
      nucleotides: 41021235
    }, {
      file: 'nvi_ref_Nvit_2.0_chr3.fa.gz',
      header: '>gi|341864959|ref|NC_015869.1| Nasonia vitripennis strain AsymCX chromosome 3, Nvit_2.0, whole genome shotgun sequence',
      nucleotides: 35577519
    }, {
      file: 'nvi_ref_Nvit_2.0_chr4.fa.gz',
      header: '>gi|341864958|ref|NC_015870.1| Nasonia vitripennis strain AsymCX chromosome 4, Nvit_2.0, whole genome shotgun sequence',
      nucleotides: 35889915
    }, {
      file: 'nvi_ref_Nvit_2.0_chr5.fa.gz',
      header: '>gi|341864957|ref|NC_015871.1| Nasonia vitripennis strain AsymCX chromosome 5, Nvit_2.0, whole genome shotgun sequence',
      nucleotides: 30704709
    }]
  }, {
    taxid: 7070,
    name: 'Tribolium castaneum (red flour beetle)',
    ncbiBuild: 2,
    version: 1,
    releaseDate: '11 June 2008',
    nucleotides: 187494969,
    files: [{
      file: 'tca_ref_chrLG1=X.fa.gz',
      header: '>gi|189313712|ref|NC_007416.2|NC_007416 Tribolium castaneum linkage group 1=X, reference assembly (based on Tcas_3.0), whole genome shotgun sequence',
      nucleotides: 10877635
    }, {
      file: 'tca_ref_chrLG2.fa.gz',
      header: '>gi|189313713|ref|NC_007417.2|NC_007417 Tribolium castaneum linkage group 2, reference assembly (based on Tcas_3.0), whole genome shotgun sequence',
      nucleotides: 20218415
    }, {
      file: 'tca_ref_chrLG3.fa.gz',
      header: '>gi|189313714|ref|NC_007418.2|NC_007418 Tribolium castaneum linkage group 3, reference assembly (based on Tcas_3.0), whole genome shotgun sequence',
      nucleotides: 38791480
    }, {
      file: 'tca_ref_chrLG4.fa.gz',
      header: '>gi|91192192|ref|NC_007419.1|NC_007419 Tribolium castaneum linkage group 4, reference assembly (based on Tcas_3.0), whole genome shotgun sequence',
      nucleotides: 13894384
    }, {
      file: 'tca_ref_chrLG5.fa.gz',
      header: '>gi|189313715|ref|NC_007420.2|NC_007420 Tribolium castaneum linkage group 5, reference assembly (based on Tcas_3.0), whole genome shotgun sequence',
      nucleotides: 19135781
    }, {
      file: 'tca_ref_chrLG6.fa.gz',
      header: '>gi|189313716|ref|NC_007421.2|NC_007421 Tribolium castaneum linkage group 6, reference assembly (based on Tcas_3.0), whole genome shotgun sequence',
      nucleotides: 13176827
    }, {
      file: 'tca_ref_chrLG7.fa.gz',
      header: '>gi|189313717|ref|NC_007422.2|NC_007422 Tribolium castaneum linkage group 7, reference assembly (based on Tcas_3.0), whole genome shotgun sequence',
      nucleotides: 20532854
    }, {
      file: 'tca_ref_chrLG8.fa.gz',
      header: '>gi|189313718|ref|NC_007423.2|NC_007423 Tribolium castaneum linkage group 8, reference assembly (based on Tcas_3.0), whole genome shotgun sequence',
      nucleotides: 18021898
    }, {
      file: 'tca_ref_chrLG9.fa.gz',
      header: '>gi|189313719|ref|NC_007424.2|NC_007424 Tribolium castaneum linkage group 9, reference assembly (based on Tcas_3.0), whole genome shotgun sequence',
      nucleotides: 21459655
    }, {
      file: 'tca_ref_chrLG10.fa.gz',
      header: '>gi|189313711|ref|NC_007425.2|NC_007425 Tribolium castaneum linkage group 10, reference assembly (based on Tcas_3.0), whole genome shotgun sequence',
      nucleotides: 11386040
    }]
  }];

  // Construct select options
  var options = new Array(genomes.length);
  genomes.forEach(function(g, i) {
    options[i] = '<option value="' + g.taxid + '"' + (g.taxid === 9606 ? ' selected' : '') + '>' + g.name + ' ' + (g.nucleotides / (1000 * 1000 * 1000)).toFixed(2) + 'Gnt</option>';
  });
  $('#taxid').html(options.join(''));

  // Initialize tooltips
  $('.control-label a').tooltip();

  // Initialize pager
  function getGenome(taxid) {
    for (var i = 0, len = genomes.length; i < len; ++i) {
      if (genomes[i].taxid === taxid) return genomes[i];
    }
  }
  var pager = $('#pager');
  pager.pager('init', [ 'Genome', 'Submitted on', 'Status', 'Log', 'Pos' ], function(job) {
    return [
      getGenome(job.taxid).name,
      $.format.date(new Date(job.submitted), 'yyyy/MM/dd HH:mm:ss'),
      job.done ? 'Done on ' + $.format.date(new Date(job.done), 'yyyy/MM/dd HH:mm:ss') : 'Queued for execution',
      job.done ? '<a href="jobs/' + job._id + '/log.csv"><img src="/excel.png" alt="log.csv"/></a>' : null,
      job.done ? '<a href="jobs/' + job._id + '/pos.csv"><img src="/excel.png" alt="pos.csv"/></a>' : null
    ];
  });

  // Refresh the table of jobs and its pager every second
  var jobs = [], skip = 0;
  var tick = function() {
    $.get('jobs', { skip: skip }, function(res) {
      if (res.length) {
        var nUpdate = 0;
        for (var i = skip; i < jobs.length; ++i) {
          var job = res[i - skip];
          jobs[i].done = job.done;
          if (job.done) ++nUpdate;
        }
        pager.pager('refresh', skip, skip + nUpdate, 2, 6, true);
        if (res.length > jobs.length - skip) {
          var len = jobs.length;
          jobs = jobs.concat(res.slice(jobs.length - skip));
          pager.pager('source', jobs);
          pager.pager('refresh', len, jobs.length, 0, 6, true);
        }
        for (skip = jobs.length; skip && !jobs[skip - 1].done; --skip);
      }
      setTimeout(tick, 1000);
    });
  };
  tick();

  // Process submission
  $('#submit').click(function() {
    // Hide tooltips
    $('.control-label a').tooltip('hide');
    // Post a new job without client side validation
    $.post('jobs', {
      email: $('#email').val(),
      taxid: $('#taxid').val(),
      queries: $('#queries').val()
    }, function(res) {
      // If server side validation fails, show tooltips
      Object.keys(res).forEach(function(param) {
        $('#' + param + '_label').tooltip('show');
      });
    }, 'json');
  });

  // Construct the accordion section of a genome
  function section(g) {
    var trs = new Array(g.files.length);
    g.files.forEach(function(f, i) {
      trs[i] = '<tr><td>' + i + '</td><td><a href="genomes/' + g.name + '/' + f.file + '">' + f.file + '</a></td><td>' + f.header + '</td><td style="text-align: right">' + f.nucleotides.comma() + '</td></tr>';
    });
    return '<h3>' + g.name + ', taxonomy id ' + g.taxid + ', NCBI build ' + g.ncbiBuild + ', version ' + g.version + ', released on ' + g.releaseDate + ', total ' + g.nucleotides.comma() + ' nucleotides in ' + g.files.length + ' files</h3><div><table class="table"><thead><tr><th>Index</th><th>File</th><th>Header</th><th>Nucleotides</th></tr></thead><tbody>' + trs.join('') + '</tbody></table></div>';
  }

  // Apply accordion to genomes
  var sections = new Array(genomes.length);
  genomes.forEach(function(g, i) {
    sections[i] = section(g);
  });
  $('#genomes').html(sections.join('')).accordion({
    collapsible: true,
    active: false,
    heightStyle: "content"
  });
});
