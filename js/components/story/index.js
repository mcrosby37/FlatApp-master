import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Image, View, TouchableOpacity, Platform, Slider, Dimensions, Share  } from 'react-native';
import { connect } from 'react-redux';

import { Actions } from 'react-native-router-flux';
import { Container, Header, Content, Text, Button, Icon, Left, Body, Right } from 'native-base';
import { Grid, Col } from 'react-native-easy-grid';

import Lightbox from 'react-native-lightbox';
import Modal from 'react-native-simple-modal';
import Swiper from 'react-native-swiper';
import { openDrawer } from '../../actions/drawer';

import theme from '../../themes/base-theme';
import styles from './styles';
import call from 'react-native-phone-call'

import { formatTime } from '../global.js';

const deviceWidth = Dimensions.get('window').width;
const primary = require('../../themes/variable').brandPrimary;

const renderPagination = (index, total, context) => (
  <View style={{ position: 'absolute', bottom: -25, right: 10 }}>
    <Text>
      <Text style={{ color: '#007aff', fontSize: 20 }}>
        {index + 1}
      </Text>
                /{total}
    </Text>
  </View>
    );

class Story extends Component {

  static propTypes = {
    navigation: PropTypes.shape({key: PropTypes.string}),
      username: PropTypes.string
  }

  constructor(props) {
    super(props);
    this.state = {
      animationType: 'slideInDown',
      open: false,
      value: 0,
    };

  }

 _shareMessage() {


    Share.share({
      message: "" + this.props.eventTitle + "\nWhen: " +  formatTime(this.props.eventStartTime, this.props.eventEndTime) + ' ' + this.props.eventDate,
      title: '' + this.props.eventImage
    })
    .then(this._showResult)
    .catch((error) => this.setState({result: 'error: ' + error.message}));
  };

  modalO() {
    this.setState({ open: true });
  }

  modalX() {
    this.setState({ open: false });
  }

_callPhone() {
  const args = {
    number:  this.props.phone, // String value with the number to call
    prompt: true // Optional boolean property. Determines if the user should be prompt prior to the call
  }

  call(args).catch(console.error)

}


  render() {


    return (
      <Container style={{ backgroundColor: '#fff' }}>
        <Image source={require('../../../images/glow2.png')} style={styles.container} >
          <Header>

          <Left>
              <Button transparent onPress={() => Actions.pop()}>
                <Icon active name="arrow-back" style={styles.headerIcons} />
              </Button>
          </Left>

              <Right>

              <Button transparent onPress={() => this._shareMessage()} >

                <Icon name="md-share" style={styles.headerIcons} />
              </Button>
              </Right>

          </Header>

          <Content showsVerticalScrollIndicator={false}>
            <View style={{ flex: 1 }}>
              <View style={{ backgroundColor: '#fff' }}>
                <View style={styles.newsContent}>
                      <TouchableOpacity>
                        <Text style={styles.eventTitle}>{this.props.eventTitle}</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.newsTypeView}>
                      <Text style={styles.newsTypeText}></Text>

                        <Text style={styles.newsTypeText}>{this.props.location}</Text>
                      </TouchableOpacity>

                  <Text style={styles.newsHeader}>

                  </Text>
                </View>

                <View style={{ padding: 20 }}>
                  <View>
                  <Text style={styles.eventTitle}>
                   {"\n"}
                </Text>

                    <Text style={styles.eventTitle}>
                  {formatTime(this.props.eventStartTime, this.props.eventEndTime)}
                  </Text>
                  <Text style={styles.eventTitle}>

                  {this.props.eventDate}
                </Text>


                <Button transparent onPress={() => this._callPhone()} >
                      <Text style={styles.eventTitle}>
                      <Icon active name="ios-call" style={styles.eventTitle} /> {this.props.phone}
                    </Text>
              </Button>

              <Text style={styles.eventTitle}>
              {this.props.email}
            </Text>
                  </View>
                </View>

              </View>
            </View>
          </Content>

        </Image>
      </Container>
    );
  }
}




function bindAction(dispatch) {
  return {
    openDrawer: () => dispatch(openDrawer()),
  };
}

const mapStateToProps = state => ({
  navigation: state.cardNavigation,
  username: state.username
});

export default connect(mapStateToProps, bindAction)(Story);
