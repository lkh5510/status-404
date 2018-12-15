import React, { Component } from "react";
import { withUser } from "../context/UserContext";
import { UiProvider } from "../context/UiContext";
import MainView from "../components/Main/MainView";
import Header from "../components/Main/Header";
import UserModal from "../components/Main/UserModal";
import PolicyView from "../components/Main/PolicyView";
// import AddressSearchView from "../components/AddressSearch/AddressSearchView";
import AddressSearchContainer from "./AddressSearchContainer";
import kakaoAPI from "../api/kakaoAPI";
import "../transition.scss";

import { CSSTransition, TransitionGroup } from "react-transition-group";

class MainContainer extends Component {
  static defaultProps = {
    // user 정보, 유저 정보 없을시 null 로 기본값 설정
    user: null,
    numberOfCartItem: 5
  };
  constructor(props) {
    super(props);
    this.state = {
      // 모달 활성화 여부
      show: false,
      // 주소 검색 모달 활성화 여부
      addressSearchShow: false,
      // loading indicator 토글용 flag
      loading: true,
      // policy 모달 컴포넌트 토글용 flag
      policy: false,
      // 미 로그인단 사용자 주소 정보 저장소
      noneAuthUserAddress: null
    };
  }

  async componentDidMount() {
    const { createUserAddress, user } = this.props;
    if (localStorage.getItem("token")) {
      // 로그인 된 사용자 주소처리
      if (!user.address) {
        // 유저 정보에 address 가 미존재
        navigator.geolocation.getCurrentPosition(
          async ({ coords: { longitude, latitude } }) => {
            const {
              data: { documents }
            } = await kakaoAPI.get("", {
              params: {
                x: longitude,
                y: latitude,
                input_coord: "WGS84"
              }
            });
            const { address, road_address } = documents[0];
            // 요청에 필요한 객체 생성
            const createdAddress = {
              lng: longitude.toFixed(5), // FIXME :: 위도 경도 소수점 이하 최대 자리수 수정시(백엔드) 자리주 제한 해제하기
              lat: latitude.toFixed(5),
              address: road_address
                ? road_address.address_name
                : address.address_name,
              old_address: address
                ? address.address_name
                : road_address.address_name,
              detail_address: "some addresas" // FIXME :: optional 로 바뀌었을 시 삭제 혹은 빈문자열 전달
            };
            await createUserAddress(createdAddress);

            this.setState({
              loading: false
            });
          }
        );
      } else {
        // 유저 정보에 address 가 존재
        this.setState({
          loading: false
        });
      }
    } else {
      // 로그인 안된 사용자 주소처리
      navigator.geolocation.getCurrentPosition(
        async ({ coords: { longitude, latitude } }) => {
          const {
            data: { documents }
          } = await kakaoAPI.get("", {
            params: {
              x: longitude,
              y: latitude,
              input_coord: "WGS84"
            }
          });
          const { address, road_address } = documents[0];
          this.setState({
            noneAuthUserAddress:
              address.address_name || road_address.address_name,
            loading: false
          });
        }
      );
    }
  }

  handleUserModal = () => {
    this.setState({ show: !this.state.show });
  };
  // 주소 검색 모달 활성화 handle function
  handleAddressSearch = () => {
    this.setState({ addressSearchShow: !this.state.addressSearchShow });
  };

  hanldePolicy = () => {
    this.setState({ policy: !this.state.policy });
  };

  render() {
    const {
      show,
      addressSearchShow,
      loading,
      policy,
      noneAuthUserAddress
    } = this.state;
    const { user, address } = this.props; // <=== UserContext 에 작성된 상태가 props로 전달됩니다.
    return (
      <React.Fragment>
        <UiProvider>
          <UserModal
            user={user}
            onUserModal={this.handleUserModal}
            showModal={show}
          />
          <Header
            user={user}
            noneAuthUserAddress={noneAuthUserAddress}
            onUserModal={this.handleUserModal}
            onAddressSearch={this.handleAddressSearch}
          />
        </UiProvider>
        <AddressSearchContainer
          show={addressSearchShow}
          onAddressSearch={this.handleAddressSearch}
          address={address}
        />
        <MainView loading={loading} hanldePolicy={this.hanldePolicy} />

        <TransitionGroup>
          {policy && (
            <CSSTransition timeout={500} classNames="fadeUp">
              <PolicyView hanldePolicy={this.hanldePolicy} />
            </CSSTransition>
          )}
        </TransitionGroup>
      </React.Fragment>
    );
  }
}

export default withUser(MainContainer);
