declare module "react-modal-video" {
  import { Component } from "react";

  interface ModalVideoProps {
    channel: string;
    autoplay?: boolean;
    start?: boolean | number;
    isOpen: boolean;
    videoId: string;
    onClose: () => void;
  }

  export default class ModalVideo extends Component<ModalVideoProps> {}
}
