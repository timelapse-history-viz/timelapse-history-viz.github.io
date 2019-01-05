import { Component } from '@angular/core';
import { ViewChild } from '@angular/core';
import { } from 'googlemaps';
import { ApiclientService } from './services/apiclient.service';
import { Options, ChangeContext } from 'ng5-slider';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  value: number = 2018;

  stepsArray = [];
  bermudaTriangle = [];
  infowindow = [];
  stepsArrayTransformed = [{value: 2018}];

  options: Options = {
    stepsArray: this.stepsArrayTransformed
  };

  setDynamicOptions(){
      // Due to change detection rules in Angular, we need to re-create the options object to apply the change
      const newOptions: Options = Object.assign({}, this.options);
      //init
      this.stepsArrayTransformed = []

      //remove duplicates
      this.stepsArray = this.stepsArray.filter(function(elem, index, self) {
        return index == self.indexOf(elem);
      });

      //sort
      this.stepsArray = this.stepsArray.sort((a, b) => a - b);

      //transform
      for(var i=0; i<this.stepsArray.length; i++){
        this.stepsArrayTransformed.push({
          value: this.stepsArray[i]
        })
      }

      newOptions.stepsArray = this.stepsArrayTransformed;
      this.options = newOptions;

      //set last value
      if(this.stepsArray.length > 0){
        this.value = this.stepsArray[this.stepsArray.length]
      } else if(this.stepsArray.length == 0){
        this.value = this.stepsArray[0]
      } 
  }

  onUserChangeEnd(changeContext: ChangeContext): void {
    console.log(changeContext.value);
    this.showPolygons();
  }

  title = 'timelapse-history-viz';
  @ViewChild('gmap') gmapElement: any;
  map: google.maps.Map;

  constructor(private apiclientService:ApiclientService){

  }

  data: any;

  ngOnInit() {
    var mapProp = {
      center: new google.maps.LatLng(23.121835, 78.039623),
      zoom: 4,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    this.map = new google.maps.Map(this.gmapElement.nativeElement, mapProp);

    
    this.apiclientService.getJSON().subscribe(data => {
        console.log('data2');
        console.log(data);
        var that = this;
        this.data = data;
        
        for(var i=0; i<data.length; i++){
          console.log(data[i].timestamp);
          this.stepsArray.push(data[i].timestamp);
        }

        this.showPolygons();
        this.setDynamicOptions();

    });
  }

  showPolygons() {

    for(var i=0; i<this.bermudaTriangle.length; i++){
      this.bermudaTriangle[i].setMap(null);
    }
    
    for(var i=0; i<this.infowindow.length; i++){
      this.infowindow[i].close();
    }
    
    var triangleCoords = [
      {lat: 25.774, lng: -80.190},
      {lat: 18.466, lng: -66.118},
      {lat: 32.321, lng: -64.757}
    ];

    var data = this.data;
    for(var i=0; i<data.length; i++){
      if(data[i].timestamp != this.value){
        continue;
      }
      triangleCoords = data[i].area;

      var color = '#'+Math.floor(Math.random()*16777215).toString(16);
      // Construct the polygon.
      var bermudaTriangle = new google.maps.Polygon({
        paths: triangleCoords,
        strokeColor: color,
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: color,
        fillOpacity: 0.35,
        zIndex: i
      });

      this.bermudaTriangle.push(bermudaTriangle);

      var infowindow = new google.maps.InfoWindow({
        content: "<b>" + data[i].title + "</b><br/>" +
        "" + data[i].description,
        position: triangleCoords[0]
      });

      this.infowindow.push(infowindow);

      google.maps.event.addListener(bermudaTriangle, 
          'click', this.infoCallback(infowindow));

      bermudaTriangle.setMap(this.map);
    }
  }

  infoCallback(infowindow) {
    return function() {
      infowindow.open(this.map);
    };
 }
}
